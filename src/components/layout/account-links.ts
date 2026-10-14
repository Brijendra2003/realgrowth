import {
  Bell,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Heart,
  History,
  Inbox,
  LayoutDashboard,
  MapPinned,
  MessageSquareText,
  PlusCircle,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { isBuyer, isLister, isStaff, type UserRole } from "@/lib/constants";

export type NavLink = { href: string; label: string; icon: LucideIcon };

export function accountLinks(role: UserRole): NavLink[] {
  if (isStaff(role)) {
    return [
      { href: "/admin", label: "Admin overview", icon: LayoutDashboard },
      { href: "/admin/verification", label: "Verification queue", icon: ClipboardCheck },
      { href: "/admin/activity", label: "Activity", icon: History },
    ];
  }
  const links: NavLink[] = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];
  if (isLister(role)) {
    links.push(
      { href: "/my-projects", label: "My properties", icon: Building2 },
      { href: "/leads", label: "Leads", icon: Inbox },
      { href: "/matching-buyers", label: "Matching buyers", icon: UsersRound },
      { href: "/list-project", label: "Add a property", icon: PlusCircle },
    );
  }
  if (isBuyer(role)) links.push({ href: "/requirements", label: "My requirements", icon: ClipboardList });
  links.push(
    { href: "/my-enquiries", label: "My enquiries", icon: MessageSquareText },
    { href: "/saved", label: "Saved", icon: Heart },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: UserRound },
  );
  return links;
}

export function adminLinks(role: UserRole): (NavLink & { group: string })[] {
  const links: (NavLink & { group: string })[] = [
    { group: "Overview", href: "/admin", label: "Overview", icon: LayoutDashboard },
    { group: "Overview", href: "/admin/activity", label: "Activity feed", icon: History },
    { group: "Moderation", href: "/admin/verification", label: "Verification queue", icon: ClipboardCheck },
    { group: "Moderation", href: "/admin/projects", label: "All projects", icon: Building2 },
    { group: "Moderation", href: "/admin/leads", label: "All leads", icon: Inbox },
    { group: "Moderation", href: "/admin/requirements", label: "Buyer requirements", icon: ClipboardList },
    { group: "Moderation", href: "/admin/users", label: "Users", icon: Users },
  ];
  if (role === "super_admin") {
    links.push(
      { group: "System", href: "/admin/staff", label: "Staff", icon: ShieldCheck },
      { group: "System", href: "/admin/settings", label: "Areas & settings", icon: MapPinned },
    );
  }
  return links;
}

