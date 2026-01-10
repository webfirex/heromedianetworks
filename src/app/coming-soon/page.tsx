'use client'

import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Page() {
    return (
        <div className="relative min-h-screen bg-background overflow-hidden">
            {/* Background orbs */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-sky-500/20 rounded-full blur-[160px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[160px]" />
            </div>

            <main className="relative z-10 min-h-screen flex items-center justify-center px-6">
                <div className="max-w-5xl w-full text-center">
                    {/* Brand */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 mx-auto mt-20 sm:mt-0"
                    >
                        <div className='flex items-center justify-center gap-2 text-xl font-semibold'>
                            <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-indigo-500 to-sky-500" ></span>
                            <h2 className="text-xl font-semibold">DevAegis</h2>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
                    >
                        High-Converting Websites.{' '}
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
                            Limited by Design.
                        </span>
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground max-w-2xl mx-auto mb-8"
                    >
                        Tailored, conversion-first landing pages
                        for founders and developers who care about results.
                    </motion.p>

                    {/* Bullet block */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-foreground mb-12 space-y-2"
                    >
                    </motion.div>

                    {/* Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        {/* Presale */}
                        <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-6 text-left">
                            <h3 className="text-lg font-semibold mb-2">
                                Presale Access — Limited
                            </h3>

                            <p className="text-sm text-muted-foreground mb-4">
                                We’re opening <strong>50 presale spots only</strong>.
                            </p>

                            <div className="text-3xl font-bold mb-4">
                                $150 <span className="text-base font-medium text-muted-foreground">/ month</span>
                            </div>

                            <p className="text-sm mb-2">Includes:</p>

                            <ul className="space-y-3 text-sm">
                                {[
                                    '1 free landing page',
                                    'Tailored copy for your business',
                                    'Ongoing page management & updates',
                                    'Priority access to future releases',
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-sky-400" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <p className="mt-4 text-xs text-muted-foreground">
                                This pricing is <strong>presale-only</strong>.
                                <br />
                                Once spots are filled, it’s gone.
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 text-left flex flex-col justify-between">
                            <div>
                                <div className='text-left text-sm text-muted-foreground'>
                                    <p className='text-foreground pb-1'>Each page is:</p>

                                    <ul className="space-y-3 text-sm">
                                        {[
                                            'Tailored to your business<',
                                            'Built on proven conversion structures',
                                            'Sold to a limited number of businesses only',
                                        ].map(item => (
                                            <li key={item} className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-sky-400" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <h3 className="text-lg font-semibold mb-2 pt-3 ">
                                    Buy in minutes. Launch fast.
                                </h3>
                                <div className='flex justify-between'>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>No calls.</p>
                                        <p>No retainers.</p>
                                        <p>No back-and-forth.</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>No mass templates.</p>
                                        <p>No long agency timelines.</p>
                                        <p>No guesswork.</p>
                                    </div>
                                </div>



                            </div>

                            <div className="mt-6">
                                <Button
                                    disabled
                                    className="w-full bg-muted text-muted-foreground cursor-not-allowed"
                                >
                                    Coming Soon
                                </Button>

                                <p className="mt-3 text-xs text-muted-foreground">
                                    Presale spots opening shortly.
                                </p>

                                <p className="mt-2 text-sm italic text-muted-foreground">
                                    Built for serious builders.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
