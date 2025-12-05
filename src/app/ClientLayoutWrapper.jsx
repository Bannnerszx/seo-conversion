"use client";
import { usePathname } from "next/navigation";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { DynamicBreadcrumbs } from "./components/Breadcrumbs";
import React, { useRef, useState, useEffect, } from 'react';
import { markBannerAsSeen } from "./actions/actions";

export default function ClientLayoutWrapper({ children, currency, userEmail, initialShowBanner }) {
  const pathname = usePathname();


  // Paths where we never show the header
  const headerHidePrefixes = [
    "/chats",
    "/orders",
    "/favorites",
    "/profile",
    "/error"
  ];

  // Paths where we never show the footer
  const footerHideExact = [
    "/login", "/login/", "/favorites", "/orders", "/profile",
    "/accountCreation", "/accountCreation/",
    "/forgotpassword", "/forgotpassword/",
    "/signup", "/signup/", "/chats", "/chats/", "/error"
  ];

  // Breadcrumbs logic stays the same
  const breadcrumbHideList = [
    "/error",
    "/chats",
    "/orders",
    "/favorites",
    "/signup",
    "/login",
    "/profile",
    "/stock",
    "/",    // special-case home
  ];

  const hideHeader = headerHidePrefixes.some(prefix =>
    pathname.startsWith(prefix)
  );

  const hideFooter = footerHideExact.some(prefix =>
    pathname.startsWith(prefix)
  );

  const hideBreadcrumbs = breadcrumbHideList.some(p =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
  const [showBanner, setShowBanner] = useState(false)
  const headerRef = useRef(null);
  const [breadcrumbTop, setBreadcrumbTop] = useState(0);

  useEffect(() => {
    const updateBreadcrumbTop = () => {
      const el = headerRef.current;
      if (el) {
        const bottom = el.offsetTop + el.offsetHeight;
        setBreadcrumbTop(bottom);
      } else {
        setBreadcrumbTop(0);
      }
    };

    updateBreadcrumbTop();
    window.addEventListener('resize', updateBreadcrumbTop);
    return () => window.removeEventListener('resize', updateBreadcrumbTop);
  }, [hideHeader, showBanner]);


  useEffect(() => {
    if (initialShowBanner) {
      markBannerAsSeen();
    }
  }, [initialShowBanner]);
  return (
    <div className="flex flex-col overflow-x-clip">


      {!hideHeader && (
        <Header showBanner={showBanner} setShowBanner={setShowBanner} headerRef={headerRef} currency={currency} userEmail={userEmail} />
      )}

      <div className="relative">
        {!hideBreadcrumbs && (
          <div className={`relative transition-[margin] duration-300 ${showBanner ? 'mt-32' : 'mt-28'} px-6`}>

            <div className="min-h-[24px]">
              <DynamicBreadcrumbs maxItems={5} />
            </div>
          </div>
        )}
        {children}
      </div>

      {/* only footer */}
      {!hideFooter && (
        <Footer />
      )}
    </div>
  );
}
