"use client";
import { usePathname } from "next/navigation";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { DynamicBreadcrumbs } from "./components/Breadcrumbs";
import React, { useRef, useState, useLayoutEffect, } from 'react';

export default function ClientLayoutWrapper({ children, currency, userEmail }) {
  const pathname = usePathname();

  // Paths where we never show the header
  const headerHidePrefixes = [
    "/chats",
    "/orders",
    "/favorites",
    "/profile",
  ];

  // Paths where we never show the footer
  const footerHideExact = [
    "/login", "/login/","/favorites","/orders","/profile",
    "/accountCreation", "/accountCreation/",
    "/forgotpassword", "/forgotpassword/",
    "/signup", "/signup/", "/chats", "/chats/"
  ];

  // Breadcrumbs logic stays the same
  const breadcrumbHideList = [
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

  useLayoutEffect(() => {
    const updateBreadcrumbTop = () => {
      const el = headerRef.current;
      if (el) {
        // offsetTop = distance from parent container’s top
        // offsetHeight = height of that div (zero if nothing is rendered)
        const bottom = el.offsetTop + el.offsetHeight;
        console.log(bottom, 'y axis')
        setBreadcrumbTop(bottom);
      } else {
        setBreadcrumbTop(0);
      }
    };

    updateBreadcrumbTop();
    window.addEventListener('resize', updateBreadcrumbTop);
    return () => window.removeEventListener('resize', updateBreadcrumbTop);
  }, [hideHeader, showBanner]);
console.log(showBanner,'breadcrumb wrapper')
  return (
    <div className="flex flex-col overflow-x-clip">


      {!hideHeader && (
        <Header showBanner={showBanner} setShowBanner={setShowBanner} headerRef={headerRef} currency={currency} userEmail={userEmail} />
      )}

      <div className="relative">
        {!hideBreadcrumbs && (
          <div className={`${showBanner ? `mt-32`:`mt-28`} px-6`}>
            <DynamicBreadcrumbs maxItems={5} />
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
