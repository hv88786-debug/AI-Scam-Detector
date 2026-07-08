import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "How does the AI detect a scam?",
      answer: "It checks wording, urgency, and known impersonation patterns to score the risk."
    },
    {
      question: "Is scanning a link safe?",
      answer: "Yes. Links are analyzed on our servers — your browser never connects directly."
    },
    {
      question: "Is my scan history stored anywhere?",
      answer: "It stays in your browser's local storage only."
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq-section" className="relative py-20 md:py-28 bg-bg-primary border-b border-border-custom">
      <div className="mx-auto px-6 max-w-[1200px]">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-accent-secondary" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent-secondary">Case 03 — Questions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary tracking-tight">
              FAQ
            </h2>
          </div>

          <div className="lg:col-span-6 lg:col-start-6" id="faq-accordion-list">
            {faqs.map((faq, index) => {
              const isOpen = activeIndex === index;

              return (
                <div key={index} className="border-b border-border-custom">
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between py-5 text-left cursor-pointer"
                    id={`faq-btn-${index}`}
                  >
                    <span className="font-display font-medium text-text-primary text-sm pr-4">
                      {faq.question}
                    </span>
                    <Plus
                      className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="pb-5 pr-8">
                          <p className="text-sm text-text-muted leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
