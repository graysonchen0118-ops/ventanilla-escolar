"use client";

import dynamic from "next/dynamic";

export const Backdrop = dynamic(() => import("./Backdrop"), {
  ssr: false,
  loading: () => <div className="bg-fallback" aria-hidden="true" />,
});

export const Mostrador = dynamic(() => import("./Mostrador"), {
  ssr: false,
  loading: () => <div className="mostrador-ph" aria-hidden="true" />,
});

export const Horas = dynamic(() => import("./Horas"), {
  ssr: false,
  loading: () => <div className="horas-ph skel" aria-hidden="true" />,
});
