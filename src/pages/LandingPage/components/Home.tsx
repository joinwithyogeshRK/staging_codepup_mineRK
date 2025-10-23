import ProjectGallery from './Gallery';
import { Hero } from '@/components/ui/hero1'

import React from 'react'
import Testimonials from './Testimonials';
import { FAQDemo } from './FAQ';


import SubscriptionCards from './subscriptionPage';

const Home = () => {
  return (
    <div>
      <section id="hero">
        <Hero
          subtitle={
            "CodePup transforms your imagination into production-ready apps with one command"
          }
        />
      </section>
      <section id="gallery">
        <ProjectGallery />
      </section>
      <section id="testimonials">
        <Testimonials />
      </section>
      <section id="pricing">
        <SubscriptionCards />
      </section>

      <section id="faq">
        <FAQDemo />
      </section>
    </div>
  );
}

export default Home
