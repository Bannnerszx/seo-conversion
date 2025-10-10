// components/Modal.jsx
import React, { forwardRef } from 'react';
import ReactDOM from 'react-dom';

const Modal = forwardRef(({ showModal, setShowModal, children, context, disableClose }, ref) => {
  if (!showModal) return null;

  // If caller didn't explicitly pass disableClose, make the modal non-closable
  // only for the 'order' context to avoid affecting other uses.
  const finalDisableClose = typeof disableClose === 'boolean' ? disableClose : (context === 'order')

  // helper to only close when allowed
  const tryClose = () => {
    if (!finalDisableClose) setShowModal(false)
  }

  return ReactDOM.createPortal(
    <>
      {/* backdrop UNDER the modal */}
      <div
        className="fixed inset-0 bg-black/50 z-[9520]"
        onClick={tryClose}
      />

      {/* modal container ABOVE the backdrop */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[9530]"
        onClick={tryClose}
      >
        {(() => {
          switch (context) {
            case 'invoice':
              return (
                <div
                  ref={ref}
                  className="w-full bg-transparent max-w-[800px] mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </div>
              );

            case 'order':
              return (
                <div
                  ref={ref}
                  className="w-full bg-white max-w-[500px] mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </div>
              );

            case 'invoiceAmend':
              return (
                <div
                  ref={ref}
                  className="w-[min(700px,calc(100vw-2rem))] flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </div>
              );

            case 'imageViewer':
              return (
                <div
                  ref={ref}
                  className="p-0 m-0 max-w-none w-screen h-screen"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </div>
              );

            case 'payment':
              return (
                <div
                  ref={ref}
                  className="w-full max-w-[470px] h-full max-h-[550px] place-items-center p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full max-w-[470px]">
                    {children}
                  </div>
                </div>
              );

            default:
              return (
                <div
                  ref={ref}
                  className="bg-white p-6 rounded shadow-lg max-w-[800px] w-full mx-auto transition-transform duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </div>
              );
          }
        })()}
      </div>
    </>,
    document.body
  );

});

Modal.displayName = 'Modal';
export default Modal;
