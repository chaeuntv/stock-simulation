import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user }) => {
  return (
    <nav>
      <ul>
        {!user ? (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/signup">Sign Up</Link></li>
          </>
        ) : (
          <li>Welcome, {user.name}</li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
