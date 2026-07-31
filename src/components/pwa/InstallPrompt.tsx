"use client";

import { useEffect, useState } from "react";
import { X, Share, Plus, Download } from "lucide-react";

const DISMISS_KEY = "contrakr:install-dismissed";

// Not in lib.dom yet — Chromium-only event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Hint = null | "ios-safari" | "ios-other-browser";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hint, setHint] = useState<Hint>(null);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until we've checked

  useEffect(() => {
    // Already installed — nothing to offer.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY)) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

    // Hold the banner back for a few seconds. Asking someone to install
    // before they've seen anything is how you train people to hit dismiss.
    const timer = setTimeout(() => {
      setDismissed(false);
      // iOS gives us no install event. Safari can add to the home screen via
      // the share sheet; every other iOS browser can't install at all, so the
      // only useful thing to tell those users is "open this in Safari."
      if (isIOS) setHint(isSafari ? "ios-safari" : "ios-other-browser");
    }, 4000);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // stop Chrome's own mini-infobar
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const close = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // The event can only be used once, either way.
    setDeferred(null);
    close();
  };

  if (dismissed || (!deferred && !hint)) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl shadow-xl p-4 animate-fadeIn">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E6FFF] flex items-center justify-center flex-shrink-0">
            <Download size={18} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#0A1628] dark:text-white leading-tight">
              Install Contrakr
            </p>

            {hint === "ios-safari" ? (
              <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Tap <Share size={13} className="inline -mt-0.5 mx-0.5" /> below, then{" "}
                <span className="font-semibold text-[#374151] dark:text-[#CBD5E1]">
                  Add to Home Screen
                  <Plus size={13} className="inline -mt-0.5 ml-0.5" />
                </span>
                .
              </p>
            ) : hint === "ios-other-browser" ? (
              <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                On iPhone, only{" "}
                <span className="font-semibold text-[#374151] dark:text-[#CBD5E1]">Safari</span>{" "}
                can install apps. Open contrakr.com in Safari, then tap{" "}
                <Share size={13} className="inline -mt-0.5 mx-0.5" /> and{" "}
                <span className="font-semibold text-[#374151] dark:text-[#CBD5E1]">
                  Add to Home Screen
                </span>
                .
              </p>
            ) : (
              <>
                <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Add it to your home screen for faster access and notifications.
                </p>
                <button
                  onClick={install}
                  className="mt-3 w-full bg-[#1E6FFF] hover:bg-[#1558CC] text-white text-[14px] font-semibold rounded-lg py-2.5 transition-colors"
                >
                  Install
                </button>
              </>
            )}
          </div>

          <button
            onClick={close}
            className="p-1 -mt-1 -mr-1 text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-white rounded-lg transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
