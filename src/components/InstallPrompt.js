import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
       <div className="bg-white p-6 rounded-lg shadow-xl m-4 max-w-sm w-full border-2 border-indigo-500">
         <h2 className="text-xl font-bold mb-4 text-indigo-900">앱 설치</h2>
         <p className="mb-6 text-gray-700">더 나은 경험을 위해 앱을 홈 화면에 설치하시겠습니까?</p>
         <div className="flex justify-end space-x-4">
           <button
             onClick={handleClose}
             className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
           >
             나중에
           </button>
           <button
             onClick={handleInstallClick}
             className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-semibold"
           >
             설치하기
           </button>
         </div>
       </div>
    </div>
  );
};

export default InstallPrompt;
