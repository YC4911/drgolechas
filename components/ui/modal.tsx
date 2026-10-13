"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ModalProps = {
  title: string;
  trigger: ReactNode;
  children: ReactNode;
};

export function Modal({ title, trigger, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => dialogRef.current?.showModal()}
      >
        {trigger}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="modal-title"
        className="border-line bg-paper text-ink backdrop:bg-teal/40 m-auto w-[min(92vw,32rem)] rounded-sm border p-0 shadow-xl"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="border-line flex items-start justify-between border-b px-6 py-4">
          <h2 id="modal-title" className="font-display text-teal text-2xl">
            {title}
          </h2>
          <form method="dialog">
            <button
              type="submit"
              aria-label="Close dialog"
              className="text-muted hover:bg-cream hover:text-teal rounded-sm px-2 py-1"
            >
              Close
            </button>
          </form>
        </div>
        <div className="p-6">{children}</div>
      </dialog>
    </>
  );
}
