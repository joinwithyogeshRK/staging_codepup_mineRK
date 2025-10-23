import ProjectGallery from '@/components/ProjectGallery';
import { Hero } from '@/components/ui/hero1'

import React from 'react'
import Testimonials from './Testimonials';
import { FAQDemo } from './FAQ';
import { CardFooter } from '@/components/ui/card';

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
   
      <section id="faq">
        <FAQDemo />
      </section>
      <section id="footer">
   
      </section>
    </div>
  );
}

export default Home
