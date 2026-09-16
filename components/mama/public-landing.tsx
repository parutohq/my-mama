import Link from 'next/link';
import { ArrowRight, Heart, LockKeyhole, Sparkles } from 'lucide-react';

const stages = ['Growing up', 'My cycle', 'Planning ahead', 'Trying for a baby', 'Pregnancy', 'After birth', 'Midlife'];

export function PublicLanding() {
  return (
    <main id="main-content" className="landing">
      <header className="landing-nav">
        <Link href="/" className="landing-brand"><Heart fill="currentColor" size={20} />mama.</Link>
        <nav aria-label="Public navigation"><a href="#journey">Your journey</a><a href="#experience">Experience</a><a href="#care">My care</a><Link href="/sign-in">Sign in</Link></nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span><Sparkles size={15} /> YOUR LIFE. YOUR PACE.</span>
          <h1>For every stage<br />of <em>womanhood.</em></h1>
          <p>Understand your body, track what matters, prepare for care and know when to get help.</p>
          <div className="landing-actions"><Link className="landing-primary" href="/sign-in?mode=sign-up">Start my journey <ArrowRight size={17} /></Link><Link className="landing-secondary" href="/sign-in">Already with MAMA? Sign in</Link></div>
          <div className="landing-hero-note"><LockKeyhole size={15} /> Your personal information stays in your private care space.</div>
        </div>
        <div className="landing-art" aria-label="A visual journey through the stages MAMA supports">
          <div className="landing-art-halo" /><div className="landing-art-halo landing-art-halo-two" />
          <div className="landing-art-card landing-art-card-main"><Heart size={24} /><strong>Your private<br />care space</strong><small>Designed to grow with you</small></div>
          <div className="landing-art-card landing-art-card-cycle"><b>DAY 14</b><span>Your recorded cycle</span></div>
          <div className="landing-art-card landing-art-card-pregnancy"><b>YOUR PATH</b><span>Prepare at your pace</span></div>
          <div className="landing-art-word">mama.</div>
        </div>
      </section>

      <section className="landing-manifesto" aria-label="MAMA principles"><p>Track <i>what matters.</i></p><span>•</span><p>Prepare <i>with care.</i></p><span>•</span><p>Keep it <i>yours.</i></p></section>

      <section id="journey" className="landing-lifecycle">
        <div><span>LIFELONG SUPPORT</span><h2>One recognisable space, through life’s changing chapters.</h2><p>Move at your own pace. Keep what helps. Your records remain yours.</p></div>
        <ol>{stages.map((stage, index) => <li key={stage}><i>{String(index + 1).padStart(2, '0')}</i><b>{stage}</b><span aria-hidden="true">↗</span></li>)}</ol>
      </section>

      <section id="experience" className="landing-product">
        <div><span>THE MAMA EXPERIENCE</span><h2>See what matters today.<br /><em>Keep what helps tomorrow.</em></h2></div>
        <div className="landing-product-cards">
          <article className="cycle"><small>CYCLE</small><div className="landing-card-visual cycle-visual"><i /><i /><i /><i /><i /></div><h3>Make space for your rhythm.</h3><p>Recorded dates and reflections, without fertility claims.</p></article>
          <article className="pregnancy"><small>PREGNANCY</small><div className="landing-card-visual path-visual"><i /><i /><i /><i /></div><h3>Prepare with care.</h3><p>Your chosen dates, appointments and questions in one place.</p></article>
          <article className="postpartum"><small>POSTPARTUM</small><div className="landing-card-visual timeline-visual"><i>Birth</i><i>Rest</i><i>Support</i></div><h3>Your recovery belongs to you.</h3><p>A quiet space for care, support and follow-up.</p></article>
        </div>
      </section>

      <section id="care" className="landing-trust">
        <article><LockKeyhole size={22} /><h2>Private by design.</h2><p>Your records belong to your signed-in account. Clinician access requires an accepted care relationship or sharing permission you can revoke.</p></article>
        <article><Heart size={22} /><h2>Care, not diagnosis.</h2><p>MAMA helps you record, prepare and learn. It does not diagnose, prescribe or replace urgent medical care.</p></article>
      </section>
      <section className="landing-cta"><span>YOUR NEXT CHAPTER</span><h2>Start with what matters to you.</h2><p>A private space for your health, questions and care.</p><Link className="landing-primary" href="/sign-in?mode=sign-up">Create my MAMA space <ArrowRight size={17} /></Link></section>
      <footer className="landing-footer"><span>© MAMA</span><span>Educational support, not an emergency service.</span><Link href="/sign-in">Sign in</Link></footer>
    </main>
  );
}
