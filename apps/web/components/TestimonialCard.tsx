"use client";

import { Quote } from "lucide-react";
import { Card, Avatar, StarRating } from "@da/ui";
import type { Testimonial } from "@da/db";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card interactive className="flex h-full flex-col">
      <Quote size={32} className="text-brand-blue-vif/25" fill="currentColor" />
      <StarRating rating={testimonial.rating} className="mt-3" />
      <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-navy/85">
        « {testimonial.content} »
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-navy/[0.06] pt-5">
        <Avatar name={testimonial.name} src={testimonial.avatar} />
        <div>
          <p className="text-sm font-bold text-navy">{testimonial.name}</p>
          <p className="text-xs text-text-secondary">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </div>
    </Card>
  );
}
