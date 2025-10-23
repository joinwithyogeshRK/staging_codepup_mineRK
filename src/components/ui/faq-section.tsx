import { PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button1";

function FAQ() {
  return (
    <section className="w-full bg-white text-gray-900 py-24 md:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-purple-50/40 to-white pointer-events-none" />

      <div className="container relative mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          {/* Left Text Section */}
          <div className="flex flex-col gap-8">
            <div>
              <Badge className="text-sm uppercase tracking-wider bg-gradient-to-r from-blue-500 to-blue-300 text-white px-4 py-1 rounded-full shadow-md">
                FAQ
              </Badge>
            </div>

            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-gray-800">
                Everything you need <br />
                <span className="text-transparent bg-clip-text font-medium bg-gradient-to-r from-blue-500 to-blue-400 italic">
                  to know about CodePup
                </span>
              </h2>

              <p className="text-lg md:text-xl leading-relaxed font-medium text-gray-700 max-w-xl">
                CodePup is your AI-powered website builder that turns prompts
                into beautiful, fully coded websites — no design or setup
                needed. Let’s clear up the questions you might have before you
                start building with AI.
              </p>
            </div>

            <div>
              <Button
                className="gap-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-300 text-white px-6 py-5 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                variant="outline"
              >
                Still curious? Let’s talk
                <PhoneCall className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Right Accordion Section */}
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-4 bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100"
          >
            {[
              {
                q: "What exactly does CodePup do?",
                a: "CodePup is your AI developer that transforms ideas into complete websites — from layout to design and code — all from a single prompt.",
              },
              {
                q: "Do I need to know how to code?",
                a: "Not at all! CodePup is built for everyone — founders, students, and devs. Just describe what you want, and CodePup builds it. Developers can also edit the generated code freely.",
              },
              {
                q: "Can I connect my custom domain?",
                a: "Yes! Once your site is ready, you can easily connect your own domain — we provide all the DNS details to make it simple.",
              },
              {
                q: "Does CodePup host websites?",
                a: "Yes, we can host your site instantly or let you export the clean React + Tailwind code to deploy anywhere like Vercel or Netlify.",
              },
              {
                q: "How does the credit system work?",
                a: "Each generation uses credits. You can top up anytime or earn free credits through referrals — transparent and simple.",
              },
              {
                q: "What makes CodePup different?",
                a: "Unlike most no-code builders, CodePup writes real, editable, production-ready code. It’s like having your own personal AI engineer.",
              },
            ].map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-gray-200 text-gray-700 shadow-sm hover:shadow-md transition-all px-3 py-2 duration-300"
              >
                <AccordionTrigger className="text-lg font-semibold text-gray-600 hover:text-blue-500">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

export { FAQ };
