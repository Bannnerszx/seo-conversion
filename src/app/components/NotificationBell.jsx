// components/NotificationCount.jsx
'use client'
import { useUnreadCount } from "@/hooks/useUnreadCount";
export default function NotificationCount({ userEmail }) {

  const count = useUnreadCount(userEmail);

  return <>{count > 0 ? `${count}` : 0}</>;
}
