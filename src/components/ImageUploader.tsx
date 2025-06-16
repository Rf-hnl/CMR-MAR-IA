
"use client";

import { useState, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud } from 'lucide-react';
import NextImage from 'next/image';

interface ImageUploaderProps {
  onUploadSuccess: (uploadResult: { public_id: string; secure_url: string }) => void;
  buttonText?: string;
  contextId: string; 
}

export default function ImageUploader({
  onUploadSuccess,
  buttonText = "Subir Imagen",
  contextId, 
}: ImageUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY; // Public API Key for client-side uploads
  const uploaderId = `image-upload-input-${contextId}`;


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Archivo Demasiado Grande",
          description: "Por favor, selecciona una imagen de menos de 5MB.",
          variant: "destructive",
        });
        setFile(null);
        setPreviewUrl(null);
        event.target.value = ''; 
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Error", description: "Por favor, selecciona un archivo primero.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Debes iniciar sesión para subir imágenes.", variant: "destructive" });
      return;
    }
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY) {
        toast({
            title: "Error de Configuración del Cliente",
            description: "La configuración de Cloudinary (cloud name o api key pública) para el cliente no está completa. Revisa las variables de entorno NEXT_PUBLIC_.",
            variant: "destructive",
        });
        setIsUploading(false);
        return;
    }

    setIsUploading(true);

    try {
      const token = await user.getIdToken();
      const sigResponse = await fetch('/api/sign-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contextId: contextId }) 
      });

      let signatureData;
      const contentType = sigResponse.headers.get("content-type");

      if (sigResponse.ok) {
        if (contentType && contentType.includes("application/json")) {
          signatureData = await sigResponse.json();
        } else {
          const textResponse = await sigResponse.text();
          console.error("Respuesta inesperada (no JSON) del endpoint de firma (status OK):", textResponse);
          throw new Error("Respuesta inesperada del servidor al obtener firma. Contenido no es JSON.");
        }
      } else {
        // sigResponse is not ok (e.g., 4xx, 5xx error)
        let errorMessage = `Error del servidor: ${sigResponse.status}`;
        if (contentType && contentType.includes("application/json")) {
          try {
            const jsonError = await sigResponse.json();
            errorMessage = jsonError.message || `Error ${sigResponse.status} desde el servidor de firma.`;
          } catch (e) {
            // JSON parsing failed, stick with status code
             console.error("Error al parsear respuesta JSON de error del endpoint de firma:", e);
          }
        } else {
          // Error response is not JSON
          const textError = await sigResponse.text();
          console.error("Respuesta de error no JSON del endpoint de firma:", sigResponse.status, textError);
          errorMessage = `Error ${sigResponse.status} desde el servidor de firma. Respuesta no es JSON. Revise la consola del navegador para más detalles.`;
        }
        throw new Error(errorMessage);
      }
      
      const { signature, timestamp } = signatureData;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', CLOUDINARY_API_KEY); // Use the public API key here
      // formData.append('folder', `your_app_folder/${contextId}`); // Optional: context-based folder

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      const cloudinaryResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json().catch(() => ({error: {message: "Error desconocido de Cloudinary."}}));
        console.error("Respuesta de error de Cloudinary:", cloudinaryResponse.status, errorData);
        throw new Error(errorData.error?.message || `Error al subir la imagen a Cloudinary. Estado: ${cloudinaryResponse.status}`);
      }

      const uploadResult = await cloudinaryResponse.json();
      
      onUploadSuccess({ public_id: uploadResult.public_id, secure_url: uploadResult.secure_url });
      
      setFile(null);
      setPreviewUrl(null);
      const fileInput = document.getElementById(uploaderId) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error: any) {
      console.error("Error en el proceso de subida de imagen:", error); 
      toast({
        title: "Error de Subida",
        description: error.message || "Ocurrió un problema al subir la imagen.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input
        id={uploaderId}
        type="file"
        accept="image/png, image/jpeg, image/gif, image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
      />
      {previewUrl && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">Previsualización:</p>
          <NextImage 
            src={previewUrl} 
            alt="Previsualización de imagen" 
            width={100} 
            height={100} 
            className="rounded-md object-cover border border-border"
            data-ai-hint="preview image"
          />
        </div>
      )}
      {file && (
        <Button onClick={handleUpload} disabled={isUploading || !file} className="w-full mt-2">
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {isUploading ? "Subiendo..." : buttonText}
        </Button>
      )}
    </div>
  );
}
