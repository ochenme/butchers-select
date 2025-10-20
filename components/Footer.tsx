import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8 mt-16">
      <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
        <div className="flex flex-col items-center space-y-2">
          <p><span className="font-semibold">公司名稱：</span> 豐鈺食品企業社</p>
          <p><span className="font-semibold">營業地址：</span> 新北市樹林區佳園路３段１４２號４樓</p>
          <p><span className="font-semibold">聯絡電話：</span> 0986500440</p>
          <p>
            <span className="font-semibold">官方社群：</span>
            <a 
              href="https://line.me/ti/g2/R7vTS-2NdM3LlpBqlVKexlmD1i3zhcCU0fJ8fg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-800 underline transition-colors"
            >
              點此加入
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;