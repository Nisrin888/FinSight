import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  TrendingUp,
  Shield,
  Zap,
  PieChart,
  Target,
  ArrowRight,
  Lock,
  Brain,
  BarChart3,
  Wallet,
  Activity,
  Eye,
} from 'lucide-react';

const Landing = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <Brain className="w-7 h-7" />,
      title: 'Know Where Your Money Goes',
      description: 'Automatically categorize every expense and see exactly where you spend the most. No more end-of-month surprises.',
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: 'Beautiful Visual Reports',
      description: 'Understand your finances at a glance with colorful charts and graphs. See your spending habits, trends, and patterns instantly.',
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: 'Reach Your Financial Goals',
      description: 'Set goals like "Save $5,000 for vacation" and track your progress. Get smart suggestions on how to reach them faster.',
    },
    {
      icon: <PieChart className="w-7 h-7" />,
      title: 'Smart Budget Tracking',
      description: 'Create budgets that actually work. Get alerts when you\'re close to overspending so you can adjust before it\'s too late.',
    },
    {
      icon: <Wallet className="w-7 h-7" />,
      title: 'Manage Multiple Accounts',
      description: 'Track checking, savings, credit cards, and cash all in one place. See your complete financial picture.',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Your Data is Safe',
      description: 'Bank-level security keeps your information private and protected. We never share or sell your data.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2D243620_1px,transparent_1px),linear-gradient(to_bottom,#2D243620_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5" />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 w-full z-50 bg-dark-bg/60 backdrop-blur-2xl border-b border-white/5"
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group transition-all duration-200 hover:scale-105">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gradient tracking-tight">
                  FinSight
                </span>
                <span className="text-[10px] text-gray-500 font-medium -mt-1">
                  Smart Finance
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-6 py-2.5 text-sm font-medium text-text-primary hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105 transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-40 pb-32 px-4 z-10">
        <div className="container-custom">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-5xl mx-auto"
          >


            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-7xl lg:text-8xl font-display font-bold mb-8 tracking-tight leading-none"
            >
              Your Money,
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                Simplified
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-text-secondary/90 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
            >
              Stop stressing about where your money goes. FinSight shows you exactly what you're spending,
              helps you save more, and gives you peace of mind about your financial future.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link
                to="/register"
                className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold shadow-2xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 text-text-primary font-semibold hover:text-white transition-colors"
              >
                Already have an account? Sign in
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-text-tertiary/80"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-success-500" />
                <span className="font-medium">Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-success-500" />
                <span className="font-medium">No credit card needed</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-success-500" />
                <span className="font-medium">Your data stays private</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ opacity, scale }}
            className="mt-20 max-w-6xl mx-auto relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 blur-3xl" />

            <div className="relative bg-gradient-to-br from-dark-card/80 to-dark-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary-500/5 via-dark-bg to-secondary-500/5 border border-white/5 overflow-hidden relative">
                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366F110_1px,transparent_1px),linear-gradient(to_bottom,#6366F110_1px,transparent_1px)] bg-[size:3rem_3rem]" />

                {/* Animated data visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-8 p-12">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.6 + i * 0.1,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="h-24 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 backdrop-blur-xl border border-white/10 rounded-xl"
                      />
                    ))}
                  </div>
                </div>

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-2xl shadow-primary-500/50"
                  >
                    <TrendingUp className="w-12 h-12 text-white" strokeWidth={2} />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4 z-10">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-6 tracking-tight">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Take Control
              </span>
            </h2>
            <p className="text-lg text-text-secondary/80 max-w-3xl mx-auto font-light">
              Simple tools that help you understand your money and make smarter financial decisions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -5 }}
                className="group relative bg-gradient-to-br from-dark-card/80 to-dark-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-primary-500/50 transition-all duration-300"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-secondary-500/0 group-hover:from-primary-500/5 group-hover:to-secondary-500/5 rounded-2xl transition-all duration-300" />

                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-primary-500/40 transition-all duration-300">
                    <div className="text-primary-400">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-text-secondary/80 leading-relaxed font-light text-sm">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 z-10">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative max-w-5xl mx-auto"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-500/20 blur-3xl" />

            <div className="relative bg-gradient-to-br from-dark-card/90 to-dark-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366F108_1px,transparent_1px),linear-gradient(to_bottom,#6366F108_1px,transparent_1px)] bg-[size:2rem_2rem]" />

              <div className="relative">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 tracking-tight">
                  Ready to Take Control of
                  <br />
                  <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                    Your Finances?
                  </span>
                </h2>
                <p className="text-lg text-text-secondary/80 mb-10 max-w-2xl mx-auto font-light">
                  Join thousands who've already simplified their money management. Start free, no credit card needed.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/register"
                    className="group relative px-10 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold shadow-2xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                  <Link
                    to="/login"
                    className="px-10 py-4 text-text-primary font-semibold hover:text-white transition-colors"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 border-t border-white/5 z-10">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gradient tracking-tight leading-tight">
                  FinSight
                </span>
                <span className="text-[9px] text-gray-500 font-medium -mt-0.5">
                  Smart Finance
                </span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm text-text-tertiary/60">
              <span className="font-medium">© 2025 FinSight</span>
              <div className="h-1 w-1 rounded-full bg-text-tertiary/40" />
              <span className="font-medium">Personal Finance Made Simple</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
