"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Share, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  isPushSupported,
  needsInstallFirst,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

type State = "checking" | "unsupported" | "install-first" | "blocked" | "off" | "on";

export default function PushToggle() {
  const [state, setState] = useState<State>("checking");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      if (!isPushSupported()) {
        setState(needsInstallFirst() ? "install-first" : "unsupported");
        return;
      }
      if (needsInstallFirst()) {
        setState("install-first");
        return;
      }
      if (Notification.permission === "denied") {
        setState("blocked");
        return;
      }
      const sub = await getExistingSubscription();
      setState(sub ? "on" : "off");
    };
    check();
  }, []);

  const enable = async () => {
    setPending(true);
    setError(null);
    const result = await subscribeToPush();
    if (result.ok) {
      setState("on");
    } else if (result.reason === "denied") {
      setState("blocked");
    } else {
      setError(
        result.reason === "no-user"
          ? "You need to be signed in."
          : "Couldn't turn on notifications. Try again in a moment."
      );
    }
    setPending(false);
  };

  const disable = async () => {
    setPending(true);
    setError(null);
    const ok = await unsubscribeFromPush();
    if (ok) setState("off");
    else setError("Couldn't turn notifications off. Try again in a moment.");
    setPending(false);
  };

  if (state === "checking") return null;

  return (
    <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-1">
        {state === "on" ? (
          <Bell size={18} className="text-[#1E6FFF] mt-0.5 flex-shrink-0" />
        ) : (
          <BellOff size={18} className="text-[#94A3B8] mt-0.5 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#0A1628] dark:text-white">
            Push notifications
          </h2>
          <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8] mt-1 leading-relaxed">
            Get alerted on this device when someone messages you, bids on your job, or leaves a
            review — even when Contrakr isn&apos;t open.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {state === "unsupported" && (
          <p className="text-[13.5px] text-[#94A3B8] dark:text-[#4B6A8A]">
            This browser doesn&apos;t support push notifications. You&apos;ll still get emails.
          </p>
        )}

        {state === "install-first" && (
          <p className="text-[13.5px] text-[#6B7280] dark:text-[#94A3B8] leading-relaxed">
            On iPhone, notifications only work once Contrakr is on your home screen. Tap{" "}
            <Share size={13} className="inline -mt-0.5 mx-0.5" /> below, then{" "}
            <span className="font-semibold text-[#374151] dark:text-[#CBD5E1]">
              Add to Home Screen
              <Plus size={13} className="inline -mt-0.5 ml-0.5" />
            </span>
            , and open Contrakr from there.
          </p>
        )}

        {state === "blocked" && (
          <p className="text-[13.5px] text-[#6B7280] dark:text-[#94A3B8] leading-relaxed">
            Notifications are blocked for this site. You&apos;ll need to re-allow them in your
            browser settings — look for the icon at the left of the address bar.
          </p>
        )}

        {state === "off" && (
          <Button variant="primary" size="md" loading={pending} onClick={enable}>
            <Bell size={15} />
            Turn on notifications
          </Button>
        )}

        {state === "on" && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#059669] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B] px-2.5 py-1.5 rounded-lg">
              <Bell size={13} />
              On for this device
            </span>
            <Button
              variant="ghost"
              size="sm"
              loading={pending}
              onClick={disable}
              className="dark:text-[#94A3B8] dark:hover:bg-[#1E3A5F]"
            >
              Turn off
            </Button>
          </div>
        )}

        {error && <p className="text-[13px] text-red-600 dark:text-red-400 mt-3">{error}</p>}
      </div>
    </div>
  );
}
