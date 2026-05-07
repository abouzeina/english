"use client";

import Link from "next/link";
import { ArrowLeft, Headphones, Zap, Globe, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Flashcard } from "@/components/features/Flashcard";
import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as any } }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full bg-mesh min-h-screen overflow-x-hidden">
      {/* Premium Hero Section */}
      <section className="w-full relative pt-6 pb-32 md:pt-10 md:pb-48 overflow-hidden">
        {/* Subtle Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute top-[-10%] left-[10%] w-[40%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse-slow" 
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute bottom-[10%] right-[10%] w-[30%] h-[40%] bg-teal-500/5 blur-[100px] rounded-full animate-pulse-slow" 
            style={{ animationDelay: '2s' }} 
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* Hero Content */}
          <motion.div 
            variants={stagger}
            initial="initial"
            animate="animate"
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-right"
          >
            <motion.div 
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-primary font-cairo text-[11px] font-bold border border-emerald-500/20 mb-10 transition-premium hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="uppercase tracking-widest">اختبر تجربة "وافي" الجديدة</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeIn}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.1] mb-10 text-balance font-sans"
            >
              Master English <br />
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-primary italic relative inline-block"
              >
                with .Precision
                <span className="absolute bottom-2 right-0 w-full h-3 bg-primary/20 -z-10 rounded-full blur-sm"></span>
              </motion.span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="text-xl md:text-2xl text-muted-foreground font-cairo max-w-2xl mb-12 leading-relaxed font-medium"
            >
              المنصة الأولى المصممة خصيصاً للعرب ولمعلمي القرآن الكريم. واجهة عصرية تركز على ما يهمك فعلياً.
            </motion.p>
            
            <motion.div 
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10"
            >
              <Link href="/levels" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-primary text-primary-foreground hover:scale-[1.05] active:scale-[0.98] transition-premium font-bold text-xl group shadow-2xl shadow-primary/30 font-cairo">
                  ابدأ رحلة التعلم
                  <ArrowLeft className="mr-3 w-6 h-6 group-hover:translate-x-1 transition-premium" />
                </Button>
              </Link>
              <Link href="/quran-guide" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 rounded-2xl border-white/10 bg-secondary/30 hover:bg-secondary transition-premium font-bold text-xl text-foreground/80 font-cairo">
                  دليل معلمي القرآن
                </Button>
              </Link>
            </motion.div>
            
            <motion.div 
              variants={fadeIn}
              className="flex items-center gap-6 text-muted-foreground/60 font-cairo"
            >
              <div className="flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>واجهة خالية من المشتتات</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>معتمد من معلمي القرآن</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visuals / Demo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" as any }}
            className="lg:col-span-5 relative w-full flex justify-center"
          >
            <div className="relative w-full max-w-md lg:max-w-none group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full group-hover:scale-150 transition-premium duration-1000" />
              
              <motion.div 
                whileHover={{ y: -10, rotate: 1 }}
                className="relative glass-panel p-2 rounded-[2.5rem] border-white/5 shadow-2xl transition-premium animate-float"
              >
                <div className="bg-background/80 rounded-[2rem] p-6 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-6 opacity-40">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  
                  <Flashcard 
                    id="hero-demo"
                    en="Consistency" 
                    ar="الاستمرارية" 
                    tags={["مفهوم أساسي"]}
                    exampleEn="Success is the result of consistency."
                    exampleAr="النجاح هو نتيجة الاستمرارية."
                    className="border-0 shadow-none bg-transparent"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
          
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="w-full py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-end mb-24"
          >
            <div className="lg:col-span-7">
              <motion.h2 variants={fadeIn} className="text-4xl md:text-6xl font-bold tracking-tight mb-8 font-cairo">
                صُمم من أجل <span className="text-primary italic">التعلم العميق.</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-xl text-muted-foreground font-cairo leading-relaxed max-w-2xl">
                لقد بنينا هذه المنصة بفلسفة "التركيز المطلق". لا مشتتات، لا ألعاب لا داعي لها، فقط أنت والمحتوى التعليمي بأعلى جودة ممكنة.
              </motion.p>
            </div>
            <motion.div variants={fadeIn} className="lg:col-span-5 flex justify-start lg:justify-end">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-bold">
                    {i}
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-background bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  +1k
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            <ModernFeatureCard 
              icon={Headphones}
              title="نظام صوتي نقي"
              titleAr="Aural Immersion"
              description="استمع، ردد، وتعلم مخارج الحروف بوضوح تام مع محرك صوتي يدعم التكرار المخصص."
            />
            <ModernFeatureCard 
              icon={Globe}
              title="مصمم للعرب"
              titleAr="Cultural Nuance"
              description="محتوى منتقى بعناية ليناسب سياقنا العربي، مع قسم خاص ومكثف لمعلمي القرآن الكريم."
            />
            <ModernFeatureCard 
              icon={Zap}
              title="اختبارات ذكية"
              titleAr="Instant Feedback"
              description="تحقق من مستواك فوراً عبر نظام اختبارات تفاعلي صُمم ليثبت المعلومة في ذاكرتك الطويلة."
            />
          </motion.div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="w-full py-48 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] -z-10 translate-y-1/2" />
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-bold tracking-tighter mb-12 text-foreground font-cairo"
          >
            ابدأ رحلة <span className="text-gradient">الإتقان</span><br />اليوم.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Link href="/levels" className="group">
              <Button size="lg" className="bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-premium h-20 px-16 rounded-[2.5rem] font-bold text-2xl font-cairo shadow-2xl shadow-primary/20 gap-4">
                ابدأ رحلتك الآن
                <ArrowLeft className="w-7 h-7 group-hover:translate-x-1 transition-premium" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
    </div>
  );
}

function ModernFeatureCard({ icon: Icon, title, titleAr, description }: any) {
  return (
    <motion.div 
      variants={fadeIn}
      whileHover={{ y: -5 }}
      className="flex flex-col group transition-premium"
    >
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-8 border border-white/5 transition-premium group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex flex-col gap-1 mb-4">
        <h3 className="text-xl font-bold font-sans tracking-tight">{title}</h3>
        <h4 className="text-lg font-bold font-cairo text-primary">{titleAr}</h4>
      </div>
      <p className="text-muted-foreground font-cairo leading-relaxed font-medium">
        {description}
      </p>
    </motion.div>
  );
}
