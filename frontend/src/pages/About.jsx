import { Link } from 'react-router-dom'

function About() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About OXY</h1>
          <p className="about-tagline">
            Empowering your journey to personal growth and wellbeing
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-mission">
            <div className="about-icon">🌱</div>
            <h2>Our Mission</h2>
            <p>
              At OXY, we believe everyone deserves access to the tools and guidance 
              needed for personal transformation. Our mission is to make self-development 
              accessible, engaging, and effective for people at every stage of their journey.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-section about-section-alt">
        <div className="about-container">
          <h2 className="section-title">Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <span className="value-icon">💚</span>
              <h3>Compassion</h3>
              <p>We approach every interaction with empathy and understanding, creating a safe space for growth.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">🎯</span>
              <h3>Excellence</h3>
              <p>We're committed to providing the highest quality courses and coaching experiences.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">🤝</span>
              <h3>Community</h3>
              <p>We foster connections between learners and coaches to build a supportive network.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">✨</span>
              <h3>Transformation</h3>
              <p>We celebrate every step of progress and believe in the power of positive change.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="about-section">
        <div className="about-container">
          <h2 className="section-title">What We Offer</h2>
          <div className="offerings-grid">
            <div className="offering-card">
              <div className="offering-icon">🔴</div>
              <h3>Live Group Courses</h3>
              <p>
                Interactive live sessions on anxiety management, productivity, 
                focus, motivation, and more. Learn in small groups with 
                real-time instruction and personalized feedback.
              </p>
              <Link to="/courses" className="btn btn-secondary">
                Explore Courses
              </Link>
            </div>
            <div className="offering-card">
              <div className="offering-icon">👥</div>
              <h3>1-on-1 Coaching</h3>
              <p>
                Connect with certified life coaches and wellness experts for 
                personalized guidance. Book sessions that fit your schedule 
                and get the support you need.
              </p>
              <Link to="/coaches" className="btn btn-secondary">
                Meet Our Coaches
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why OXY Section */}
      <section className="about-section about-section-alt">
        <div className="about-container">
          <h2 className="section-title">Why Choose OXY?</h2>
          <div className="why-grid">
            <div className="why-item">
              <span className="why-number">01</span>
              <h4>Evidence-Based Approach</h4>
              <p>Our courses and coaching methods are grounded in psychology and proven techniques.</p>
            </div>
            <div className="why-item">
              <span className="why-number">02</span>
              <h4>Expert-Led Content</h4>
              <p>Learn from certified professionals with years of experience in their fields.</p>
            </div>
            <div className="why-item">
              <span className="why-number">03</span>
              <h4>Flexible Learning</h4>
              <p>Access courses anytime, anywhere. Book coaching sessions that fit your schedule.</p>
            </div>
            <div className="why-item">
              <span className="why-number">04</span>
              <h4>Supportive Community</h4>
              <p>Join a community of like-minded individuals on their journey to self-improvement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="contact-box">
            <h2>Get in Touch</h2>
            <p>Have questions or want to learn more? We'd love to hear from you.</p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <div>
                  <strong>Email</strong>
                  <p>hello@oxy-wellbeing.com</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <div>
                  <strong>Location</strong>
                  <p>Tbilisi, Georgia</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🕐</span>
                <div>
                  <strong>Support Hours</strong>
                  <p>Mon - Fri, 9am - 6pm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="about-container">
          <h2>Ready to Begin Your Journey?</h2>
          <p>Take the first step towards a better you. Join OXY today.</p>
          <div className="about-cta-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Create Free Account
            </Link>
            <Link to="/courses" className="btn btn-secondary btn-large">
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About

