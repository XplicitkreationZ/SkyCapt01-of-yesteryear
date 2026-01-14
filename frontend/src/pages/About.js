export default function About(){
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8" data-testid="about-page">
      <h1 className="text-4xl md:text-5xl font-bold text-white" data-testid="about-title">Xplicit Delivery: Your Local Hemp Delivery Service</h1>
      <p className="text-zinc-300 leading-relaxed" data-testid="about-intro">Xplicit Delivery is Austin's premier on-demand delivery service for legal hemp-derived products and smoke shop accessories. We bring the smoke shop experience directly to your door — fast, discreet, and 100% compliant.</p>
      
      <section data-testid="about-mission" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">Our Mission</h3>
        <p className="text-zinc-300">To provide adults 21+ with convenient, legal access to high-quality hemp products without the hassle of driving to a store. We believe in quality, convenience, and complete compliance with Texas hemp laws.</p>
      </section>
      
      <section data-testid="about-how-it-works" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">How It Works</h3>
        <p className="text-zinc-300">Browse our curated selection of hemp consumables, glass pieces, accessories, and culinary supplies. Place your order online, and we'll dispatch a courier to deliver straight to your door within our 40-mile Austin service area. ID verification required at delivery.</p>
      </section>
      
      <section data-testid="about-products" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">What We Deliver</h3>
        <ul className="text-zinc-300 list-disc list-inside space-y-1">
          <li>Legal hemp flower and pre-rolls</li>
          <li>Rolling papers, wraps, and cones</li>
          <li>Glass pipes, bongs, and accessories</li>
          <li>Grinders and storage solutions</li>
          <li>Whip cream chargers and culinary supplies</li>
        </ul>
      </section>
      
      <section data-testid="about-compliance" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">100% Legal & Compliant</h3>
        <p className="text-zinc-300">All our hemp products comply with Texas state law and the 2018 Farm Bill, containing less than 0.3% Delta-9 THC. We partner only with licensed, lab-tested suppliers who provide Certificates of Analysis (COAs) for every product.</p>
      </section>
      
      <section data-testid="about-service-area" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">Service Area</h3>
        <p className="text-zinc-300">We currently deliver within a 40-mile radius of Austin, TX (78751). Delivery fees and minimum orders vary by distance tier. Texas residents only, 21+ with valid ID.</p>
      </section>
      
      <section data-testid="about-contact" className="space-y-2">
        <h3 className="text-emerald-400 font-semibold">Get In Touch</h3>
        <p className="text-zinc-300">Questions? Visit our <a href="/faq" className="text-emerald-400 underline">FAQ page</a> or reach out via our website. We're here to help you get what you need, when you need it.</p>
      </section>
    </div>
  );
}
