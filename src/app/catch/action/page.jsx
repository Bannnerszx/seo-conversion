import { Suspense } from "react";
import AuthActionPage from "./AuthActionPage";
import Loader from "@/app/components/Loader";
export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <AuthActionPage />
    </Suspense>
  );
}