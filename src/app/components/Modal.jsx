// components/Modal.jsx
import React, { forwardRef } from 'react';
import ReactDOM from 'react-dom';

const Modal = forwardRef(({ showModal, setShowModal, children, context }, ref) => {
  if (!showModal) return null;

  return ReactDOM.createPortal(
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black opacity-50 z-[9499]"
        onClick={() => setShowModal(false)}
      />

      {/* centering container */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[9500]"
        onClick={() => setShowModal(false)}
      >
        {(() => {
          // pick one of four wrappers based on context
          switch (context) {
            case 'invoice':
              // no className at all
              return (
                <div
                  ref={ref}
                  onClick={e => e.stopPropagation()}
                >
                  {children}
                </div>
              );

            case 'order':
              return (
                <div
                  ref={ref}
                  className="w-full max-w-[500px] mx-auto"
                  onClick={e => e.stopPropagation()}
                >
                  {children}
                </div>
              );

            case 'imageViewer':
              return (
                <div
                  ref={ref}
                  className="p-0 m-0 max-w-none w-screen h-screen"
                  onClick={e => e.stopPropagation()}
                >
                  {children}
                </div>
              );

            default:
              return (
                <div
                  ref={ref}
                  className="bg-white p-6 rounded shadow-lg max-w-[800px] w-full mx-auto transition-transform duration-300"
                  onClick={e => e.stopPropagation()}
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
