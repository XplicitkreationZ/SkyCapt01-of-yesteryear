export default function About(){
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8" data-testid="about-page">
      <h1 className="text-4xl md:text-5xl font-bold text-white" data-testid="about-title">XplicitKreationZ: We're about to change everything!</h1>
      <p className="text-zinc-300 leading-relaxed" data-testid="about-intro">Launched in May 2024, XplicitKreationZ is changing the game. Using science and nature to craft high-quality cannabis products for both fun and function.</p>
      <section data-testid="about-euphoria" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">From Euphoria to Wellness</h3>
        <p className="text-zinc-300">XKZ is more than just a fun high. We use THC-A and medical-grade CBD to address everyday needs. Whether it be a euphoric escape or relief from pain, our edibles, smokables, and topicals are designed with you in mind.</p>
      </section>
      <section data-testid="about-innovation" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">Taste the Innovation</h3>
        <p className="text-zinc-300">Explore our diverse range of edibles, premium flower, convenient vapes, and soothing topicals. And stay tuned for our upcoming pet care line!</p>
      </section>
      <section data-testid="about-people" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">For the People</h3>
        <p className="text-zinc-300">Everyone 21+ is welcome. Cannabis is for everyone, and we tailor our products to your needs.</p>
      </section>
      <section data-testid="about-batches" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">Small Batches, Big Impact</h3>
        <p className="text-zinc-300">We craft each small batch with five base ingredients and natural flavors, ensuring a pure and potent experience.</p>
      </section>
      <section data-testid="about-family" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">A Family Affair</h3>
        <p className="text-zinc-300">As a family-owned business, we bring diverse expertise to deliver exceptional products. From concept to consumption, quality and innovation are our top priorities.</p>
      </section>
      <section data-testid="about-cta" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">Experience the Difference</h3>
        <p className="text-zinc-300">Ready to explore handcrafted cannabis? Visit <a href="https://www.xplicitkreationz.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">www.xplicitkreationz.com</a> and discover the XKZ difference today!</p>
      </section>
    </div>
  );
}
