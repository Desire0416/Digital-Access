"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "../animations/variants";

export interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
}

/** Conteneur qui fait apparaître ses <StaggerItem> en cascade au scroll. */
export function StaggerGroup({ children, className, once = true }: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
