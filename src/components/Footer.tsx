import Link from 'next/link'
import { Github, Twitter, Linkedin, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card py-20 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-silver/5 blur-[120px] rounded-full pointer-events-none translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-10 h-10 rounded-xl border border-border flex items-center justify-center bg-card group-hover:silver-glow transition-all duration-500">
                <span className="text-sm font-bold silver-glow-text">Ag</span>
              </div>
              <span className="text-[12px] font-bold tracking-[0.4em] text-foreground/20 uppercase group-hover:text-foreground/40 transition-colors">ARGENTUM</span>
            </Link>
            <p className="text-foreground/40 text-sm max-w-xs leading-relaxed italic">
              "Build in public. Prove it forever." <br />
              The source of truth for creators.
            </p>
            <div className="flex items-center gap-4">
              <SocialLink icon={<Github size={18} />} href="https://github.com/saurabhsingh-98" />
              <SocialLink icon={<Twitter size={18} />} href="https://twitter.com" />
              <SocialLink icon={<Linkedin size={18} />} href="https://www.linkedin.com/in/saurabh-singh-381a65383/" />
              <SocialLink icon={<Globe size={18} />} href="https://argentum-silk.vercel.app" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-bold text-foreground uppercase tracking-[0.2em]">Product</h4>
            <div className="flex flex-col gap-3">
              <FooterLink href="/feed">Feed</FooterLink>
              <FooterLink href="/explore">Explore</FooterLink>
              <FooterLink href="/challenges">Challenges</FooterLink>
              <FooterLink href="/verified">Verified Builds</FooterLink>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-bold text-foreground uppercase tracking-[0.2em]">Platform</h4>
            <div className="flex flex-col gap-3">
               <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/brand">Brand Assets</FooterLink>
              <FooterLink href="/contact">Report an Issue</FooterLink>
              <FooterLink href="mailto:hello@argentum.build">Contact Support</FooterLink>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} ARGENTUM PROTOCOL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-[11px] text-foreground/40 hover:text-foreground transition-all duration-300 font-bold uppercase tracking-tighter hover:translate-x-1 inline-block"
    >
      {children}
    </Link>
  )
}

function SocialLink({ icon, href }: { icon: React.ReactNode, href: string }) {
  return (
    <Link 
      href={href} 
      target="_blank"
      className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground/40 hover:text-foreground hover:border-foreground/40 transition-all duration-300"
    >
      {icon}
    </Link>
  )
}
