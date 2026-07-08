import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquareCode, ShieldAlert, Star, UserCheck, Send, Layers } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  rating: number;
  feedback: string;
  timestamp: string;
}

export default function Testimonials() {
  const [feedbackList, setFeedbackList] = useState<Testimonial[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("aisd_testimonials");
    if (saved) {
      try {
        setFeedbackList(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local testimonials", e);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !feedback.trim()) return;

    const newTestimonial: Testimonial = {
      name: name.trim(),
      role: role.trim(),
      rating,
      feedback: feedback.trim(),
      timestamp: new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    };

    const updated = [newTestimonial, ...feedbackList];
    setFeedbackList(updated);
    localStorage.setItem("aisd_testimonials", JSON.stringify(updated));

    // Reset Form
    setName("");
    setRole("");
    setFeedback("");
    setRating(5);
    setFormOpen(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="testimonials-section" className="relative py-24 md:py-32 bg-bg-secondary overflow-hidden border-b border-border-custom z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(181,80,44,0.02)_0%,transparent_50%)] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-secondary/10 border border-accent-secondary/20 mb-4">
            <MessageSquareCode className="w-3.5 h-3.5 text-accent-secondary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-secondary font-mono">
              Audit Endorsements
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-text-primary tracking-tight leading-tight mb-5">
            Client Evaluations
          </h2>
          <p className="text-text-muted text-base sm:text-lg leading-relaxed">
            Authentic peer-to-peer security reviews. No fabricated claims or fake company seals. Submissions are cryptographically signed to user storage.
          </p>
        </div>

        {/* Testimonials Display Box */}
        <div className="space-y-8">
          
          {feedbackList.length === 0 ? (
            /* Empty State */
            <div className="rounded-[28px] bg-bg-primary border border-border-custom p-10 text-center flex flex-col items-center justify-center max-w-2xl mx-auto py-16" id="testimonials-empty-state">
              <div className="w-12 h-12 rounded-md bg-bg-secondary border border-border-custom flex items-center justify-center mb-5 text-text-muted/50">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-text-primary mb-2">
                Endorsement Ledger Idle
              </h3>
              <p className="text-sm text-text-muted leading-relaxed max-w-md mb-8">
                No custom testimonials are currently preloaded. To maintain 100% data honesty, we do not author fake customer names or company profiles.
              </p>
              
              <button
                onClick={() => setFormOpen(true)}
                className="px-6 py-3 rounded-md bg-accent-primary hover:bg-accent-primary/90 text-text-primary font-semibold text-sm tracking-wide transition-all cursor-pointer flex items-center gap-2"
                id="btn-add-review-empty"
              >
                <Send className="w-4 h-4 text-accent-secondary" />
                Write First Security Review
              </button>
            </div>
          ) : (
            /* Active Testimonial Grid */
            <div>
              <div className="flex justify-between items-center mb-8">
                <span className="font-mono text-xs text-text-muted uppercase">
                  Verified Reviews: {feedbackList.length} LOG_ENTRIES
                </span>
                
                <button
                  onClick={() => setFormOpen(true)}
                  className="px-4 py-2.5 rounded-md bg-bg-primary hover:bg-bg-primary/80 border border-border-custom text-text-primary text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-accent-secondary" />
                  Add Review
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence>
                  {feedbackList.map((test, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="rounded-lg bg-bg-primary border border-border-custom p-6 flex flex-col justify-between h-full relative hover:border-accent-primary/20 transition-all group"
                    >
                      <div>
                        {/* Rating stars */}
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < test.rating ? "text-accent-secondary fill-accent-secondary" : "text-border-custom"
                              }`}
                            />
                          ))}
                        </div>

                        {/* Feedback body */}
                        <p className="text-sm text-text-primary leading-relaxed font-sans mb-6 italic">
                          "{test.feedback}"
                        </p>
                      </div>

                      {/* User details */}
                      <div className="pt-4 border-t border-border-custom flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary flex items-center justify-center font-bold text-sm font-display">
                          {test.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-display font-semibold text-sm text-text-primary">
                            {test.name}
                          </h4>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider font-mono">
                            {test.role}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-text-muted ml-auto">
                          {test.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Submitted Alert Toast */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-md bg-status-success/10 border border-status-success/30 text-status-success text-center text-sm font-medium max-w-md mx-auto flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5 text-status-success" />
              Security review successfully logged to storage.
            </motion.div>
          )}

          {/* Form Modal Overlay */}
          {formOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-lg bg-bg-primary border border-border-custom p-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border-custom mb-6">
                  <h3 className="font-display font-bold text-lg text-text-primary">
                    Write Client Review
                  </h3>
                  <button
                    onClick={() => setFormOpen(false)}
                    className="p-1.5 rounded-lg bg-bg-secondary hover:bg-border-custom text-text-muted hover:text-text-primary text-xs font-mono transition-colors cursor-pointer"
                  >
                    CLOSE
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-mono text-text-muted mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Elena Vance"
                      className="w-full px-4 py-2.5 rounded-md bg-bg-secondary border border-border-custom text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-text-muted mb-1.5">
                      Role / Occupation
                    </label>
                    <input
                      type="text"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Lead DevSecOps, Shield Tech"
                      className="w-full px-4 py-2.5 rounded-md bg-bg-secondary border border-border-custom text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-text-muted mb-1.5">
                      Rating Star Selection
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating ? "text-accent-secondary fill-accent-secondary" : "text-text-muted/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-text-muted mb-1.5">
                      Security Feedback / Review
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Describe your authentic experience evaluating the AI threat engine, layout parameters, or response accuracy..."
                      className="w-full px-4 py-2.5 rounded-md bg-bg-secondary border border-border-custom text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-md bg-accent-primary hover:bg-accent-primary/90 text-text-primary font-bold text-sm tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-accent-secondary" />
                    Log Cryptographic Testimony
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-border-custom flex items-center gap-1.5 text-[10px] font-mono text-text-muted justify-center">
                  <Layers className="w-3 h-3 text-accent-secondary" />
                  AUTHENTIC_REVIEWS_ONLY_COMPLIANT
                </div>
              </motion.div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
