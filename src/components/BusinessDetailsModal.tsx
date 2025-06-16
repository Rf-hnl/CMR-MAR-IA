"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BusinessDetail } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner"; // Changed to default import
import { useEffect } from "react";



interface BusinessDetailsModalProps {
  business: BusinessDetail | null;
  open: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BusinessDetailsModal: React.FC<BusinessDetailsModalProps> = ({ business, open, loading, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Detalles del Negocio</DialogTitle>
      </DialogHeader>
      <DialogContent className="sm:max-w-[425px]">
        {loading && <LoadingSpinner />}
        {!loading && business && (
          <>
            <DialogHeader>
              <DialogTitle>{business.name}</DialogTitle>
              {business.rating && <DialogDescription>Rating: {business.rating}</DialogDescription>}
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {business.formatted_address && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-1">Address:</div>
                  <div className="col-span-3">{business.formatted_address}</div>
                </div>
              )}
              {business.vicinity && business.formatted_address !== business.vicinity && (
                 <div className="grid grid-cols-4 items-center gap-4">
                 <div className="col-span-1">Vicinity:</div>
                 <div className="col-span-3">{business.vicinity}</div>
               </div>
              )}
              {business.international_phone_number && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-1">Phone:</div>
                  <div className="col-span-3">{business.international_phone_number}</div>
                </div>
              )}
              {business.website && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-1">Website:</div>
                  <div className="col-span-3">
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {business.website}
                    </a>
                  </div>
                </div>
              )}
              {business.types && business.types.length > 0 && (
                 <div className="grid grid-cols-4 items-center gap-4">
                 <div className="col-span-1">Types:</div>
                 <div className="col-span-3">{business.types.join(', ')}</div>
               </div>
              )}
              {business.opening_hours && (
                <div className="grid gap-2">
                  <div className="font-semibold">Opening Hours:</div>
                  {business.opening_hours && business.opening_hours.weekday_text && business.opening_hours.weekday_text.map((day, index) => (
                    <div key={index}>{day}</div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
