"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Factory,
  Users,
  Truck,
  Leaf,
  Settings2,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const operacionesItems = [
  { href: "/recepcion", label: "Recepción", icon: Package },
  { href: "/produccion", label: "Producción", icon: Factory },
  { href: "/proveedores", label: "Proveedores", icon: Users },
  { href: "/salidas", label: "Salidas", icon: Truck },
  { href: "/cierre-balance", label: "Cierre y Balance", icon: FileText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Factory className="size-5" />
          <span>PescaTrace</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Operaciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operacionesItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {process.env.NODE_ENV === "development" && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/calibracion-anexo1"}>
                      <Link href="/calibracion-anexo1">
                        <Settings2 className="size-4" />
                        <span>Calibración Anexo 1</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>
                      <Badge variant="secondary" className="text-xs">
                        Dev
                      </Badge>
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/calibracion-anexo3"}>
                      <Link href="/calibracion-anexo3">
                        <Settings2 className="size-4" />
                        <span>Calibración Anexo 3</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>
                      <Badge variant="secondary" className="text-xs">
                        Dev
                      </Badge>
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/sigersol"}>
                  <Link href="/sigersol">
                    <Leaf className="size-4" />
                    <span>Exportar SIGERSOL</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge>
                  <Badge variant="secondary" className="text-xs">
                    WIP
                  </Badge>
                </SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
