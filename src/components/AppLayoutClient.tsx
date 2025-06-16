"use client";

import React, { useState } from 'react';
import '@/styles/sidebar.css';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ListChecks, Search, LogOut, PackageSearch, FileUp, Send, Cable, Zap, UserCircle, LayoutDashboard, Bell, TrendingUp, Settings, MessageSquare, Phone, Tags, FileText, Users, Briefcase, ShieldCheck, Palette, ConciergeBell, Calculator, Brain, User, Building2, Database, PlusCircle, Link2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useFirebaseInit } from '@/hooks/useFirebaseInit';
import { useOrganization } from '@/hooks/useOrganization';
import { signOut } from 'firebase/auth';
import OrganizationInfoModal from '@/components/OrganizationInfoModal';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User as FirebaseUser } from 'firebase/auth';
import Image from 'next/image';
import LoadingComponent from '@/components/LoadingComponent';

// Replace LogoIcon with logo.png in SidebarHeader
const AppLayoutClient = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user, authInstance, loading: authLoading, initialLoadDone } = useAuth();
  const { isInitialized, isInitializing } = useFirebaseInit();
  const { currentOrganization } = useOrganization();
  const router = useRouter();
  const { toast } = useToast();
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

  // Leer estado inicial del sidebar desde cookie
  const getInitialSidebarState = () => {
    if (typeof document !== 'undefined') {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('sidebar_state='))
        ?.split('=')[1];
      return cookieValue === 'true';
    }
    return true; // default abierto
  };

  const noSidebarPaths = ['/login', '/register'];
  const showSidebar = initialLoadDone && user && !noSidebarPaths.includes(pathname);
  const showOnlyChildren = initialLoadDone && (!user || noSidebarPaths.includes(pathname));

  const handleLogout = async () => {
    if (!authInstance) return;
    try {
      await signOut(authInstance);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
      router.push('/login'); 
    } catch (error: any) {
      toast({ title: "Error al Cerrar Sesión", description: error.message, variant: "destructive" });
    }
  };

  if (authLoading || !initialLoadDone) {
     if (noSidebarPaths.includes(pathname)) {
        return <>{children}<Toaster /></>;
     }
     return <LoadingComponent message="Cargando aplicación..." />;
  }

  // Mostrar loading mientras se inicializan las colecciones de Firebase
  if (user && isInitializing && !noSidebarPaths.includes(pathname)) {
    return <LoadingComponent message="Inicializando configuraciones..." />;
  }

  if (showOnlyChildren) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }
  
  if (!user) {
     return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  const menuSections = [
    {
      title: 'PRINCIPAL',
      items: [
        { href: '/business-finder', label: 'Dashboard', icon: LayoutDashboard, currentPathMatcher: (p: string) => p === '/business-finder' || p === '/' },
        { href: '/leads', label: 'Flujo de Leads', icon: ListChecks, currentPathMatcher: (p: string, sp: URLSearchParams) => p.startsWith('/leads') && sp.get('action') !== 'import-xml' },
      ]
    },
    {
      title: 'LEADS',
      items: [
        { href: '/lead-sources', label: 'Obtener Leads', icon: Search, currentPathMatcher: (p: string) => p.startsWith('/lead-sources') },
        { href: '/leads/manage', label: 'Agregar Leads', icon: PlusCircle, currentPathMatcher: (p: string) => p.startsWith('/leads/manage') },
      ]
    },
    {
      title: 'NEGOCIO',
      items: [
        { href: '/products', label: 'Mi Catálogo', icon: PackageSearch, currentPathMatcher: (p: string) => p === '/products' },
        { href: '/services', label: 'Mis Servicios', icon: Briefcase, currentPathMatcher: (p: string) => p === '/services' },
        { href: '/valuation', label: 'Valoración', icon: Calculator, currentPathMatcher: (p: string) => p === '/valuation' },
      ]
    },
    {
      title: 'COMUNICACIÓN',
      items: [
        { href: '/quotes', label: 'Cotizaciones IA', icon: Calculator, currentPathMatcher: (p: string) => p === '/quotes' },
        { href: '/billing-quotes', label: 'Cotizaciones PandaDoc', icon: Building2, currentPathMatcher: (p: string) => p === '/billing-quotes' },
        { href: '/tracking-links', label: 'Tracking Links', icon: Link2, currentPathMatcher: (p: string) => p === '/tracking-links' },
        { href: '/email-campaigns', label: 'Campañas de Email', icon: Send, currentPathMatcher: (p: string) => p === '/email-campaigns' },
        { href: '/channels', label: 'Canales', icon: Cable, currentPathMatcher: (p: string) => p === '/channels' },
      ]
    },
    {
      title: 'CONFIGURACIÓN',
      items: [
        { href: '/ai-prompts', label: 'IA y Prompts', icon: Brain, currentPathMatcher: (p: string) => p === '/ai-prompts' },
        { href: '/automations', label: 'Automatizaciones', icon: Zap, currentPathMatcher: (p: string) => p === '/automations' },
        { href: '/config', label: 'General', icon: Settings, currentPathMatcher: (p: string) => p === '/config' },
      ]
    }
  ];


  return (
    <SidebarProvider 
      defaultOpen={getInitialSidebarState()}
    > 
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar 
          collapsible="icon" 
          side="left" 
          variant="sidebar" 
          className="sidebar border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground shadow-md"
        >
          <SidebarHeader className="p-4 flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Link href="/business-finder" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded" priority />
              <h1 className="font-semibold text-xl text-sidebar-primary group-data-[collapsible=icon]:hidden">MAR-IA</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex-grow p-2">
            {menuSections.map(section => (
              <SidebarGroup key={section.title} className="p-0 mb-2">
                <SidebarGroupLabel className="px-2 text-xs uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">
                  {section.title}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {section.items.map(item => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.currentPathMatcher(pathname, new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''))}
                        tooltip={{ children: item.label, side: "right", align:"center" }}
                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                      >
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter className="p-3 mt-auto border-t border-sidebar-border">
            {user && (
              <SidebarMenu>
                {/* User Profile Link */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/profile'}
                    tooltip={{ children: "Mi Perfil", side: "right", align:"center" }}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link href="/profile" className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'Usuario'} />
                        <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                          {user.email ? user.email[0].toUpperCase() : <UserCircle size={16}/>}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs group-data-[collapsible=icon]:hidden flex-1">
                        <p className="font-medium text-sidebar-foreground truncate max-w-[120px]">{user.displayName || user.email}</p>
                        <p className="text-muted-foreground text-[10px]">Ver perfil</p>
                      </div>
                      <User className="h-4 w-4 group-data-[collapsible=icon]:hidden" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Logout Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip={{ children: "Cerrar Sesión", side: "right", align:"center" }}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <LogOut className="h-5 w-5"/>
                    <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-h-screen bg-background">
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="sidebar-trigger -ml-1 hover:bg-accent hover:text-accent-foreground transition-all duration-200" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/business-finder" className="font-medium flex items-center gap-2">
                    <Image src="/logo.png" alt="Logo" width={20} height={20} className="rounded" priority />
                    MAR-IA
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathname !== '/business-finder' && pathname !== '/' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#" className="capitalize">
                        {pathname.split('/')[1]?.replace('-', ' ') || 'Dashboard'}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            
            {/* Current Organization Display */}
            <div className="flex-1"></div>
            {currentOrganization && (
              <button
                onClick={() => setIsOrgModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border/50 shadow-sm hover:bg-muted/70 hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                <span className="text-sm font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px] group-hover:text-indigo-700 transition-colors">
                  {currentOrganization.name}
                </span>
                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/30 font-mono hidden sm:inline group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                  {currentOrganization.id.slice(-6)}
                </span>
              </button>
            )}
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-8  overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
      <Toaster />

      {/* Organization Info Modal */}
      <OrganizationInfoModal
        organization={currentOrganization}
        open={isOrgModalOpen}
        onOpenChange={setIsOrgModalOpen}
        userIsOwner={currentOrganization?.ownerId === user?.uid}
      />
    </SidebarProvider>
  );
};

export default AppLayoutClient;
