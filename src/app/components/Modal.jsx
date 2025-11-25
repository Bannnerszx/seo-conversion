// components/Modal.jsx
import React, { forwardRef } from 'react';
import ReactDOM from 'react-dom';

const Modal = forwardRef(({ showModal, setShowModal, children, context, disableClose, siblingOpen = false }, ref) => {
  if (!showModal) return null;

  // If caller didn't explicitly pass disableClose, make the modal non-closable
  // only for the 'order' context to avoid affecting other uses.
  const finalDisableClose = typeof disableClose === 'boolean' ? disableClose : (context === 'order')

  // helper to only close when allowed
  const tryClose = () => {
    if (!finalDisableClose) setShowModal(false)
  }

  // Use higher z-index for certain contexts (e.g. nested modals launched from invoice previews)
  const backdropClass = context === 'order' ? 'fixed inset-0 bg-black/50 z-[300000]' : 'fixed inset-0 bg-black/50 z-[9520]';
  const containerClass = context === 'order' ? 'fixed inset-0 flex items-center justify-center z-[300010]' : 'fixed inset-0 flex items-center justify-center z-[9530]';

  return ReactDOM.createPortal(
    <>
      {/* backdrop UNDER the modal */}
      <div
        className={backdropClass}
        onClick={tryClose}
      />

      {/* modal container ABOVE the backdrop */}
      <div
        className={containerClass}
        onClick={tryClose}
      >
        {(() => {
          switch (context) {
            case 'invoice':
              // Collapse when either the caller explicitly indicates a sibling/modal is open
              // (preferred — re-renders correctly) or fall back to checking the body class.
              let invoiceCollapsed = !!siblingOpen;
              if (!invoiceCollapsed) {
                try {
                  invoiceCollapsed = typeof document !== 'undefined' && document.body.classList.contains('rmj-order-open');
                } catch (e) {
                  invoiceCollapsed = false;
                }
              }

              return (
                <div
                  ref={ref}
                  className={`w-full bg-transparent ${invoiceCollapsed ? 'max-w-0 overflow-hidden' : 'max-w-[800px]'} mx-auto transition-all duration-200`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </div>
              );
            case 'footer':
              return (
                <div
                  ref={ref}
                  className="w-full bg-transparent max-w-[450px] mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </div>
              );
            case 'documentAddress':
              return (
                <div
                  ref={ref}
                  className="w-full bg-white max-w-[800px] mx-auto"
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
