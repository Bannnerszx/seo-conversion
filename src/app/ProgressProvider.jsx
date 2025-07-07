'use client';
import { usePathname } from 'next/navigation';
import { ProgressProvider } from '@bprogress/next/app';

const Providers = ({ children }) => {
  const pathname = usePathname();

  
  const disableSameURL = pathname === '/';

  return (
    <ProgressProvider
      height="4px"
      color="#0000ff"
      options={{ showSpinner: false }}
      shallowRouting={false}       /* show bar even on query-only navs */
      disableSameURL={disableSameURL}  /* true on “/”, false elsewhere */
    >
      {children}
    </ProgressProvider>
  );
};

export default Providers;
