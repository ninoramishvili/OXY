import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>OXY</h4>
          <p>Your journey to personal growth and wellbeing starts here.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <Link to="/courses">Courses</Link>
          <Link to="/coaches">Coaches</Link>
          <Link to="/login">Login</Link>
        </div>
        
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>📧 hello@oxy.com</p>
          <p>📞 +1 (555) 123-4567</p>
          <p>📍 123 Wellness Street</p>
        </div>
        
        <div className="footer-section">
          <h4>Follow Us</h4>
          <p>Instagram</p>
          <p>Facebook</p>
          <p>Twitter</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2024 OXY. All rights reserved. Made with 💜 for your wellbeing.</p>
      </div>
    </footer>
  )
}

export default Footer

