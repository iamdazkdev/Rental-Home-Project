import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh',
      fontFamily: 'sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '6rem', margin: '0 0 1rem 0', color: '#ff5a5f' }}>404</h1>
      <h2 style={{ margin: '0 0 1rem 0', fontSize: '2rem' }}>Không tìm thấy trang</h2>
      <p style={{ marginBottom: '2rem', color: '#666', fontSize: '1.1rem' }}>Trang bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.</p>
      <Link 
        to="/" 
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#ff5a5f', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '16px',
          transition: 'background-color 0.3s'
        }}
      >
        Về trang chủ
      </Link>
    </div>
  );
};

export default NotFoundPage;
