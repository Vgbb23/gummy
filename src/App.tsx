/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { 
  Menu, 
  Search, 
  User, 
  Bell, 
  ShoppingCart, 
  ChevronRight, 
  ChevronDown, 
  Instagram, 
  Youtube,
  Plus,
  Minus,
  ArrowRight,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Gem,
  Star,
  ArrowLeft,
  Truck,
  CreditCard,
  CheckCircle,
  Copy,
  QrCode,
  MapPin,
  Loader2,
  Clock,
  Info,
  Check,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { persistFullQuery, mergeStoredQueryParams } from './utils/campaignQuery';
import { collectUtmParamsFromSearch, persistUtmSearch } from './utils/utm';
import {
  encodeUpsellCustomerPrefill,
  isFruitfyOrderPaid,
  normalizePhoneForUpsell,
} from './utils/postPaymentRedirect';

const POLL_ORDER_MS = 200;
const REDIRECT_AFTER_PAID_MS = 1200;
/** Mesmo destino padrão do Verisol (.env) quando VITE_POST_PAYMENT_REDIRECT_URL está vazio. */
const DEFAULT_POST_PAYMENT_URL = 'https://rastreiogummy.netlify.app/';

type CartLine = {
  id: string;
  title: string;
  img: string;
  price: string;
  count: number;
};

const cartLineId = (product: { title: string; price: string }) =>
  `${product.title}|||${product.price}`;

const lineSubtotalBRL = (line: CartLine) =>
  parseFloat(line.price.replace(',', '.')) * line.count;

const cartSubtotalBRL = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + lineSubtotalBRL(line), 0);

const formatMoneyBR = (value: number) => value.toFixed(2).replace('.', ',');

const CHECKOUT_ORDER_BUMPS = [
  {
    id: 'vit-d-abacaxi',
    img: 'https://iili.io/q6o4XiF.md.png',
    title: 'Gummy® Vitamina D Abacaxi - 90 g',
    price: '19,90',
    description:
      'O “sol em goma”: ossos e imunidade fortes, com sabor de abacaxi que vira ritual diário.',
  },
  {
    id: 'vit-c-tangerina',
    img: 'https://iili.io/q6oDTDG.md.png',
    title: 'Gummy® Vitamina C Tangerina - 120 g',
    price: '19,90',
    description:
      'Antioxidante de verdade: defesas em dia e pele com brilho — tangerina que você não esquece de tomar.',
  },
  {
    id: 'creatina-morango',
    img: 'https://iili.io/q6xHXsa.md.png',
    title: 'Gummy® Creatina Morango 315g',
    price: '19,90',
    description:
      'Mais força e resultado no treino, zero drama: creatina em goma sabor morango, prática e concentrada.',
  },
] as const;

// --- Components ---

const Header = ({
  cartItemCount,
  onOpenCart,
}: {
  cartItemCount: number;
  onOpenCart: () => void;
}) => (
  <header className="sticky top-0 z-50 bg-white shadow-sm">
    <div className="bg-gummy-pink text-white text-[10px] font-bold py-2 px-4 text-center uppercase tracking-wider">
      FRETE GRÁTIS EM COMPRAS ACIMA DE R$199 🚚
    </div>
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-4">
        <Menu className="w-6 h-6 text-gummy-pink" />
        <Search className="w-6 h-6 text-gummy-pink" />
      </div>
      
      <div className="flex-1 flex justify-center">
        <img 
          src="https://i.ibb.co/JYBVHhH/image.png" 
          alt="Gummy Original" 
          className="h-8 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex items-center gap-2">
        <User className="w-6 h-6 text-gummy-pink" />
        <div className="w-10 h-5 bg-slate-100 rounded-full relative p-0.5 flex items-center border border-slate-200">
          <div className="w-4 h-4 bg-gummy-pink rounded-full ml-auto shadow-sm" />
        </div>
        <div className="relative">
          <Bell className="w-6 h-6 text-gummy-pink" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-gummy-pink rounded-full border border-white" />
        </div>
        <button
          type="button"
          onClick={onOpenCart}
          className="relative p-1 rounded-full hover:bg-gummy-light-pink/50 transition-colors"
          aria-label="Abrir carrinho"
        >
          <ShoppingCart className="w-6 h-6 text-gummy-pink" />
          {cartItemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-gummy-pink text-white text-[10px] font-black border-2 border-white">
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </button>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="relative overflow-hidden">
    <img 
      src="https://i.ibb.co/TxgxjS56/image.png" 
      alt="Mês do Consumidor Gummy Original" 
      className="w-full h-auto block"
      referrerPolicy="no-referrer"
    />
  </section>
);

const CategoryTabs = () => (
  <div className="bg-gummy-light-pink px-6 py-8 flex justify-center">
    <a 
      href="#nossos-kits"
      className="w-full btn-pink-gradient text-white py-6 rounded-full font-black text-xl shadow-xl active:scale-95 transition-transform uppercase tracking-tight text-center flex items-center justify-center"
    >
      QUERO MEUS GUMMYS!
    </a>
  </div>
);

const ProductBenefits = () => (
  <section className="bg-white py-16 px-8">
    <div className="max-w-md mx-auto text-center">
      <span className="text-gummy-pink font-black text-[10px] uppercase tracking-[0.2em] mb-4 block">
        Beleza de Dentro para Fora
      </span>
      <h2 className="text-3xl font-black text-gummy-dark-purple leading-tight mb-6 font-display">
        Por que escolher a <span className="text-gummy-pink italic">Gummy®?</span>
      </h2>
      <p className="text-slate-500 font-medium mb-12 leading-relaxed text-sm">
        Nossa fórmula exclusiva foi desenvolvida por especialistas para entregar o máximo de nutrição com o sabor que você ama.
      </p>

      <div className="flex flex-col gap-4">
        {[
          {
            title: 'Absorção Superior',
            desc: 'A mastigação inicia a digestão, facilitando a absorção dos nutrientes pelo corpo.',
            icon: (
              <span className="relative flex h-5 w-5 items-center justify-center">
                <Star className="h-5 w-5" strokeWidth={1.5} />
                <Plus className="absolute -right-1 -top-0.5 h-2 w-2" strokeWidth={2.5} />
              </span>
            ),
          },
          {
            title: 'Praticidade no Dia a Dia',
            desc: 'Leve seus Gummys para qualquer lugar. Saúde sem complicação e sem precisar de água.',
            icon: <Truck className="h-5 w-5" strokeWidth={1.5} />,
          },
          {
            title: 'Fórmula Concentrada',
            desc: 'Máxima potência em cada goma, desenvolvida por especialistas em nutrição.',
            icon: <Gem className="h-5 w-5" strokeWidth={1.5} />,
          },
          {
            title: 'Sabor Irresistível',
            desc: 'O ritual de saúde que você realmente vai querer repetir todos os dias.',
            icon: <Heart className="h-5 w-5" strokeWidth={1.5} />,
          },
        ].map((benefit, i) => (
          <div
            key={i}
            className="flex items-center gap-5 rounded-[32px] border border-[#FCEEF2] bg-[#FFF9FA] p-6 text-left"
          >
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-[#B85C7E] shadow-[0_4px_6px_rgba(0,0,0,0.05)]"
            >
              {benefit.icon}
            </div>
            <div className="min-w-0">
              <h4 className="mb-1 text-base font-bold text-[#2D3748]">{benefit.title}</h4>
              <p className="text-sm font-normal leading-relaxed text-[#8E9AAF]">{benefit.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 relative">
        <div className="absolute inset-0 bg-gummy-pink/5 blur-3xl rounded-full"></div>
        <div className="relative p-8 bg-white rounded-[40px] border border-gummy-pink/10 shadow-sm italic text-slate-600 text-sm font-medium">
          "Transformou minha autoestima. Meu cabelo nunca esteve tão brilhante e volumoso!"
          <div className="mt-4 not-italic text-[9px] font-black uppercase tracking-widest text-gummy-pink">
            — Depoimento Real
          </div>
        </div>
      </div>
    </div>
  </section>
);

const InfluencerCarousel = () => (
  <section className="bg-gummy-light-pink py-8 px-4">
    <div className="flex gap-3 justify-between">
      {[
        { 
          name: '@anny_ferreira10', 
          product: 'Gummy Hair® ZERO', 
          video: 'https://res.cloudinary.com/dpcxlsbwd/video/upload/v1774221619/2e512182a3354cb9a2cb8b4f94a78ad4.SD-480p-0.9Mbps-45007457_bhq6x6.mp4' 
        },
        { 
          name: '@dudaa.guerra', 
          product: 'Gummy® Vinagre', 
          video: 'https://res.cloudinary.com/dpcxlsbwd/video/upload/v1774221620/a7980c301ae8498dbe0f3cde021384ff.HD-720p-1.6Mbps-26527005_u82ztv.mp4' 
        },
      ].map((item, i) => (
        <div key={i} className="w-[48%] flex flex-col gap-3">
          <div className="rounded-[30px] overflow-hidden aspect-[9/16] relative shadow-lg bg-slate-200">
            <video 
              src={item.video} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              loop 
              playsInline
            />
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
          </div>
          <div className="flex items-center gap-2 px-1">
            <img src="https://picsum.photos/seed/prod-small/100/100" className="w-8 h-8 rounded-full object-contain bg-white p-1" referrerPolicy="no-referrer" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-black text-slate-800 truncate">{item.name}</span>
              <span className="text-[8px] text-slate-500 font-medium truncate">{item.product}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const CategoriesGrid = () => (
  <section className="bg-gummy-light-pink py-10 px-6 flex flex-col gap-6">
    <h2 className="text-2xl font-black text-gummy-dark-purple text-center mb-4 font-display">Conheça Nossas Categorias</h2>
    {[
      { title: 'CABELO & PELE', img: 'https://i.ibb.co/xSk5wW9y/image.png' },
      { title: 'METABOLISMO', img: 'https://i.ibb.co/HDxQ7P5m/image.png' },
      { title: 'SONO E IMUNIDADE', img: 'https://i.ibb.co/0wFW3KJ/image.png' },
      { title: 'HAIRCARE', img: 'https://i.ibb.co/yBYhGMDG/image.png' },
    ].map((cat, i) => (
      <div key={i} className="bg-white rounded-full px-10 flex items-center justify-between shadow-md relative overflow-hidden h-32 border border-slate-50">
        <span className="text-base font-black text-gummy-dark-purple z-10 font-display tracking-tight w-1/2 leading-tight">
          {cat.title}
        </span>
        <div className="absolute right-0 top-0 h-full w-[55%] flex items-center justify-end">
          <img 
            src={cat.img} 
            alt={cat.title} 
            className="h-[110%] object-contain object-right" 
            referrerPolicy="no-referrer" 
          />
        </div>
      </div>
    ))}
  </section>
);

const ProductCard = ({ item, i, onAddToCart }: { item: any, i: number, onAddToCart: (p: any) => void, key?: any }) => {
  const [quantity, setQuantity] = useState(1);
  const hasSelector = !item.hideQuantity;

  const baseOldPrice = parseFloat(item.oldPrice.replace(',', '.'));
  
  const getPrice = (q: number) => {
    if (item.prices && item.prices[q]) {
      return parseFloat(item.prices[q].replace(',', '.'));
    }
    const basePrice = parseFloat(item.price.replace(',', '.'));
    if (q === 1) return basePrice;
    if (q === 2) return basePrice * 2 * 0.9;
    if (q === 3) return basePrice * 3 * 0.8;
    return basePrice;
  };

  const currentPriceValue = getPrice(quantity);
  const currentPrice = currentPriceValue.toFixed(2).replace('.', ',');
  const currentOldPrice = (baseOldPrice * quantity).toFixed(2).replace('.', ',');

  // Calculate real discount percentage
  const discountPercent = Math.round((1 - (currentPriceValue / (baseOldPrice * quantity))) * 100);

  return (
    <div className="bg-[#fdf0f5] rounded-[60px] p-10 flex flex-col items-center shadow-sm relative border border-white/50">
      <div className="absolute top-8 left-8 bg-[#d4f58c] text-[#3f3d56] text-sm font-black px-4 py-1.5 rounded-full">
        -{discountPercent}%
      </div>
      
      <img 
        src={item.img} 
        alt={item.title} 
        className="w-full aspect-[4/3] object-contain mb-8" 
        referrerPolicy="no-referrer" 
      />
      
      <h3 className="text-2xl font-black text-[#3f3d56] text-center mb-4 leading-tight max-w-[280px] font-display">
        {item.title}
      </h3>

      {hasSelector && (
        <div className="flex flex-col items-center gap-4 mb-8 w-full">
          <span className="text-[10px] font-black text-[#d14d85] uppercase tracking-[0.2em]">Escolha a quantidade:</span>
          <div className="flex gap-2 w-full max-w-[280px]">
            {[1, 2, 3].map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all border-2 ${
                  quantity === q 
                  ? 'bg-gummy-pink border-gummy-pink text-white shadow-lg scale-105' 
                  : 'bg-white border-pink-100 text-gummy-dark-purple hover:border-gummy-pink/30'
                }`}
              >
                {q} {item.title.toLowerCase().includes('kit') ? (q === 1 ? 'Kit' : 'Kits') : (q === 1 ? 'Pote' : 'Potes')}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center gap-1 mb-10">
        <span className="text-base text-[#d14d85] line-through font-bold opacity-60">De: R$ {currentOldPrice}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-[#3f3d56] uppercase">Por:</span>
          <span className="text-4xl font-black text-[#3f3d56]">R$ {currentPrice}</span>
        </div>
        {(hasSelector || item.priceTagline) && (
          <span className="text-[10px] text-green-600 font-black uppercase mt-1 tracking-widest">
            {hasSelector
              ? item.title.toLowerCase().includes('kit')
                ? quantity === 1
                  ? 'Mix completo para 30 dias'
                  : quantity === 2
                    ? 'Mix completo para 60 dias'
                    : 'Mix completo para 90 dias'
                : quantity === 1
                  ? 'Tratamento para 30 dias'
                  : quantity === 2
                    ? 'Tratamento para 60 dias'
                    : 'Tratamento para 90 dias'
              : item.priceTagline}
          </span>
        )}
      </div>

      <button 
        onClick={() => onAddToCart({ 
          ...item, 
          price: currentPrice, 
          title: hasSelector
            ? `${item.title} (${quantity} ${item.title.toLowerCase().includes('kit') ? (quantity === 1 ? 'Kit' : 'Kits') : (quantity === 1 ? 'Pote' : 'Potes')})`
            : item.title,
        })}
        className="w-full bg-[#d4f58c] text-[#3f3d56] font-black py-6 rounded-full flex items-center justify-center gap-3 text-xl shadow-md active:scale-95 transition-transform"
      >
        Adicionar ao carrinho <ShoppingCart className="w-6 h-6 flex-shrink-0" />
      </button>
    </div>
  );
};

const BestSellers = ({ onAddToCart }: { onAddToCart: (product: any) => void }) => (
  <section id="nossos-kits" className="bg-gummy-light-pink py-12 px-6">
    <h2 className="text-3xl font-black text-gummy-dark-purple text-center mb-8 font-display uppercase tracking-tight">Nossos Kits</h2>
    
    <div className="flex flex-col gap-8">
      {[
        { 
          title: 'Gummy® Hair - Cabelo & Pele', 
          oldPrice: '127,00', 
          price: '33,90', 
          prices: { 1: '33,90', 2: '56,90', 3: '67,90' },
          discount: '-73%', 
          installment: '2x R$ 16,95',
          img: 'https://i.ibb.co/xSk5wW9y/image.png'
        },
        { 
          title: 'Gummy® Apple - Metabolismo', 
          oldPrice: '127,00', 
          price: '34,90', 
          prices: { 1: '34,90', 2: '57,90', 3: '68,90' },
          discount: '-72%', 
          installment: '2x R$ 17,45',
          img: 'https://i.ibb.co/HDxQ7P5m/image.png' 
        },
        { 
          title: 'Gummy® Night - Sono & Imunidade', 
          oldPrice: '127,00', 
          price: '32,90', 
          prices: { 1: '32,90', 2: '55,90', 3: '66,90' },
          discount: '-74%', 
          installment: '2x R$ 16,45',
          img: 'https://i.ibb.co/0wFW3KJ/image.png' 
        },
        { 
          title: 'Kit Gummy® Trio - Mix Completo', 
          oldPrice: '127,00', 
          price: '68,90', 
          prices: { 1: '68,90', 2: '116,90', 3: '169,90' },
          discount: '-46%', 
          installment: '2x R$ 34,45',
          img: 'https://i.ibb.co/pD42VtP/image.png' 
        },
        {
          title: 'Kit Gummy® Cronograma Capilar',
          oldPrice: '127,00',
          price: '69,90',
          discount: '-45%',
          installment: '2x R$ 34,95',
          img: 'https://iili.io/q6C4ocx.md.png',
          hideQuantity: true,
          priceTagline: 'Tratamento capilar completo',
        },
      ].map((item, i) => (
        <ProductCard key={i} item={item} i={i} onAddToCart={onAddToCart} />
      ))}
    </div>
  </section>
);

const WhatsappCTA = () => (
  <section className="px-6 py-6 bg-white">
    <img 
      src="https://i.ibb.co/Z6YM1dHB/image.png" 
      className="w-full rounded-[40px] shadow-lg" 
      alt="WhatsApp CTA"
      referrerPolicy="no-referrer" 
    />
  </section>
);

const BlogSection = () => (
  <section className="bg-gummy-light-pink py-12 px-6">
    <h2 className="text-3xl font-black text-gummy-dark-purple text-center mb-10 font-display">Blog da Gummy</h2>
    
    <div className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-slate-50">
      <img src="https://i.ibb.co/r2VhFChq/image.png" className="w-full aspect-[4/3] object-cover" referrerPolicy="no-referrer" />
      <div className="p-8">
        <h3 className="text-xl font-black text-gummy-pink mb-6 leading-tight font-display">
          Benefícios do zinco: por que esse mineral é essencial para seu corpo?
        </h3>
        <p className="text-sm text-slate-600 mb-8 leading-relaxed font-medium">
          O zinco é um mineral essencial para o organismo mas que o corpo não consegue produzir naturalmente. É essencial em várias funções...
        </p>
        <div className="text-xs text-slate-400 mb-8 font-bold">12 de dezembro de 2025</div>
        <button className="w-full btn-pink-gradient text-white font-black py-5 rounded-full text-sm uppercase tracking-widest transition-all">
          VER DETALHES
        </button>
      </div>
    </div>
  </section>
);

const Footer = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

  const sections = [
    { id: 'PRODUTOS', title: 'PRODUTOS' },
    { id: 'FACA_PARTE', title: 'FAÇA PARTE' },
    { id: 'INFORMACAO', title: 'INFORMAÇÃO' },
    { id: 'SUPORTE', title: 'SUPORTE' },
  ];

  return (
    <footer className="bg-white pt-16 pb-12 px-8">
      <div className="flex flex-col items-center mb-12">
        <img src="https://i.ibb.co/JYBVHhH/image.png" className="h-10 mb-8 object-contain" referrerPolicy="no-referrer" />
        <div className="flex gap-8">
          <Instagram className="w-7 h-7 text-gummy-pink" />
          <div className="w-7 h-7 bg-gummy-pink rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white text-[10px] font-black">T</span>
          </div>
          <Youtube className="w-7 h-7 text-gummy-pink" />
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-16">
        {sections.map((s) => (
          <div key={s.id} className="border-b border-gummy-pink/10">
            <button 
              onClick={() => toggle(s.id)}
              className="w-full py-5 flex items-center justify-between text-gummy-pink font-black text-sm tracking-tight"
            >
              {s.title}
              {openSection === s.id ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
            <AnimatePresence>
              {openSection === s.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 flex flex-col gap-3 text-xs text-slate-500 font-bold">
                    <span>Link Exemplo 1</span>
                    <span>Link Exemplo 2</span>
                    <span>Link Exemplo 3</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center text-center gap-6">
        <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
          © 2025 Gummy – Todos Os Direitos Reservados. <br />
          <span className="text-gummy-pink">Termos e Condições | Política de Privacidade</span>
        </p>
        
        <div className="flex gap-3 flex-wrap justify-center mt-4">
          {['pix', 'visa', 'master', 'elo', 'apple'].map((p) => (
            <div key={p} className="bg-white border border-slate-100 rounded-md px-3 py-1.5 h-8 flex items-center shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400">{p}</span>
            </div>
          ))}
        </div>

        <div className="text-gummy-pink font-black text-2xl mt-8 tracking-tighter">alfinet</div>
      </div>
    </footer>
  );
};

const CartDrawer = ({
  isOpen,
  onClose,
  lines,
  setLines,
  onCheckout,
}: {
  isOpen: boolean;
  onClose: () => void;
  lines: CartLine[];
  setLines: React.Dispatch<React.SetStateAction<CartLine[]>>;
  onCheckout: () => void;
}) => {
  const subtotal = cartSubtotalBRL(lines);

  const increment = (id: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, count: l.count + 1 } : l))
    );
  };

  const decrement = (id: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, count: l.count - 1 } : l))
        .filter((l) => l.count > 0)
    );
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/45"
            onClick={onClose}
            aria-label="Fechar carrinho"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="cart-drawer-title" className="font-display text-xl font-black text-gummy-dark-purple">
                Carrinho
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gummy-dark-purple hover:bg-slate-100 transition-colors"
                aria-label="Fechar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {lines.length === 0 ? (
                <p className="text-center text-sm font-medium text-slate-500 py-12">
                  Seu carrinho está vazio. Adicione produtos na loja.
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {lines.map((line) => (
                    <li
                      key={line.id}
                      className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3"
                    >
                      <img
                        src={line.img}
                        alt=""
                        className="h-20 w-20 flex-shrink-0 rounded-xl bg-white object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1 flex flex-col gap-2">
                        <h3 className="text-sm font-black leading-tight text-gummy-dark-purple">
                          {line.title}
                        </h3>
                        <p className="text-sm font-black text-gummy-pink">
                          R$ {formatMoneyBR(lineSubtotalBRL(line))}
                          {line.count > 1 && (
                            <span className="ml-1 text-[10px] font-bold text-slate-400">
                              ({line.count} × R$ {line.price})
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={() => decrement(line.id)}
                              className="p-2 text-gummy-dark-purple hover:bg-slate-50 rounded-l-xl transition-colors"
                              aria-label="Diminuir quantidade"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-black text-gummy-dark-purple">
                              {line.count}
                            </span>
                            <button
                              type="button"
                              onClick={() => increment(line.id)}
                              className="p-2 text-gummy-dark-purple hover:bg-slate-50 rounded-r-xl transition-colors"
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            aria-label="Remover item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white p-5 space-y-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-500">Subtotal</span>
                <span className="text-xl font-black text-gummy-dark-purple">
                  R$ {formatMoneyBR(subtotal)}
                </span>
              </div>
              <button
                type="button"
                disabled={lines.length === 0}
                onClick={() => {
                  onCheckout();
                }}
                className="w-full btn-pink-gradient py-4 rounded-full font-black text-white shadow-lg active:scale-[0.98] transition-transform disabled:opacity-40 disabled:grayscale"
              >
                Finalizar pedido
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 text-sm font-black uppercase tracking-widest text-gummy-pink"
              >
                Continuar comprando
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

type PixChargeData = {
  copyPasteCode: string;
  qrCodeUrl: string;
  orderId?: string;
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** CPF com 11 dígitos e dígitos verificadores válidos. */
const isValidCpf = (cpfDigits: string): boolean => {
  const cpf = onlyDigits(cpfDigits).slice(0, 11);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(cpf[10]);
};

const priceStringToCents = (value: string) =>
  Math.round(parseFloat(value.replace(',', '.')) * 100);

const extractQuantityFromTitle = (title: string) => {
  const match = title.match(/\((\d+)\s/i);
  return match ? Number(match[1]) : 1;
};

const isPixEmvCode = (value: string) =>
  value.startsWith('000201') && value.length >= 30;

const collectStringValues = (input: unknown, acc: string[] = []): string[] => {
  if (typeof input === 'string') {
    acc.push(input);
    return acc;
  }

  if (Array.isArray(input)) {
    input.forEach((item) => collectStringValues(item, acc));
    return acc;
  }

  if (input && typeof input === 'object') {
    Object.values(input).forEach((item) => collectStringValues(item, acc));
    return acc;
  }

  return acc;
};

const formatCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

const formatCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
};

const getPixChargeFromResponse = (responseJson: any): PixChargeData | null => {
  const data = responseJson?.data ?? responseJson;
  const copyPasteCode =
    data?.pix_code ??
    data?.pix_payload ??
    data?.copy_paste ??
    data?.pixCopyPaste ??
    data?.pix?.copy_paste ??
    data?.pix?.payload ??
    data?.payment?.pix?.copy_paste ??
    data?.payment?.pix?.payload ??
    data?.qr_code_text ??
    data?.emv ??
    data?.code;

  const dynamicCopyPaste = copyPasteCode ?? collectStringValues(data).find(isPixEmvCode);
  if (!dynamicCopyPaste) return null;

  const qrCodeField =
    data?.qr_code_url ??
    data?.qrCodeUrl ??
    data?.pix_qr_code ??
    data?.pix?.qr_code ??
    data?.payment?.pix?.qr_code ??
    data?.payment?.pix?.qr_code_url ??
    data?.qr_code;

  const qrCodeUrl =
    typeof qrCodeField === 'string' && qrCodeField.startsWith('data:image')
      ? qrCodeField
      : typeof qrCodeField === 'string' && qrCodeField.startsWith('http')
      ? qrCodeField
      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dynamicCopyPaste)}`;

  const orderId = data?.order_uuid ?? data?.order_id ?? data?.id ?? data?.order?.id;

  return {
    copyPasteCode: dynamicCopyPaste,
    qrCodeUrl,
    orderId,
  };
};

const safeJsonFromResponse = async (response: Response) => {
  const rawText = await response.text();
  if (!rawText || !rawText.trim()) return {};

  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
};

const Checkout = ({
  lines,
  onClose,
  onOrderCreated,
}: {
  lines: CartLine[];
  onClose: () => void;
  onOrderCreated?: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [loadingCep, setLoadingCep] = useState(false);
  const [shipping, setShipping] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'form' | 'success'>('form');
  const [copied, setCopied] = useState(false);
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixChargeData | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('waiting_payment');
  const hasRedirectedAfterPayment = useRef(false);
  const [cpfTouched, setCpfTouched] = useState(false);
  const [cepTouched, setCepTouched] = useState(false);
  const [cepApiInvalid, setCepApiInvalid] = useState(false);
  const [bumpSelections, setBumpSelections] = useState<Record<string, boolean>>({});

  const cpfDigits = onlyDigits(formData.cpf);
  const cepDigits = onlyDigits(formData.cep);
  const cpfIncomplete = cpfTouched && cpfDigits.length > 0 && cpfDigits.length < 11;
  const cpfInvalidChecksum = cpfDigits.length === 11 && !isValidCpf(cpfDigits);
  const cpfError = cpfIncomplete || cpfInvalidChecksum;
  const cepLengthError = cepTouched && cepDigits.length > 0 && cepDigits.length !== 8;
  const cepError = cepLengthError || cepApiInvalid;

  const handleCopyPix = () => {
    if (!pixData?.copyPasteCode) return;
    navigator.clipboard.writeText(pixData.copyPasteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    setCepApiInvalid(false);
    setFormData((prev) => ({ ...prev, cep }));
    if (cep.length < 8) {
      setShipping(null);
      return;
    }
    if (cep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setCepApiInvalid(false);
          setFormData((prev) => ({
            ...prev,
            cep,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));
          setShipping('free');
        } else {
          setCepApiInvalid(true);
          setShipping(null);
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        setCepApiInvalid(true);
        setShipping(null);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const cartSubtotalCents = lines.reduce(
    (acc, l) => acc + priceStringToCents(l.price) * l.count,
    0
  );
  const bumpsSubtotalCents = CHECKOUT_ORDER_BUMPS.reduce(
    (acc, b) => acc + (bumpSelections[b.id] ? priceStringToCents(b.price) : 0),
    0
  );
  const subtotalCents = cartSubtotalCents + bumpsSubtotalCents;
  const subtotal = subtotalCents / 100;
  const total = subtotal + (shipping === 'sedex' ? 19.54 : 0);
  const createPixCharge = async () => {
    setIsCreatingPix(true);
    setPixError(null);

    try {
      const sanitizedCpf = onlyDigits(formData.cpf);
      const sanitizedPhone = onlyDigits(formData.phone);
      const bumpCount = CHECKOUT_ORDER_BUMPS.filter((b) => bumpSelections[b.id]).length;
      const quantityMeta =
        lines.reduce(
          (acc, l) => acc + l.count * extractQuantityFromTitle(l.title),
          0
        ) + bumpCount;
      const shipCents = shipping === 'sedex' ? 1954 : 0;
      const finalTotalInCents = subtotalCents + shipCents;
      const bumpsTitles = CHECKOUT_ORDER_BUMPS.filter((b) => bumpSelections[b.id])
        .map((b) => b.title)
        .join(' | ');
      let ui_product_name = lines
        .map((l) => (l.count > 1 ? `${l.title} ×${l.count}` : l.title))
        .join(' | ');
      if (bumpsTitles) {
        ui_product_name = ui_product_name
          ? `${ui_product_name} | [+] ${bumpsTitles}`
          : `[+] ${bumpsTitles}`;
      }

      const response = await fetch('/api/pix/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: sanitizedPhone,
          cpf: sanitizedCpf,
          amountInCents: finalTotalInCents,
          utm: collectUtmParamsFromSearch(window.location.search || ''),
          metadata: {
            ui_product_name,
            ui_quantity: quantityMeta,
            ui_subtotal_cents: subtotalCents,
            ui_shipping_cents: shipCents,
            ...(bumpsSubtotalCents > 0
              ? {
                  ui_order_bumps_cents: bumpsSubtotalCents,
                  ui_order_bumps: bumpsTitles,
                }
              : {}),
          },
        }),
      });

      const responseJson = await safeJsonFromResponse(response);
      if (!response.ok || responseJson?.success === false) {
        const backendMessage = responseJson?.message || responseJson?.error;
        throw new Error(
          backendMessage
            ? `Não foi possível criar a cobrança na Fruitfy (${response.status}): ${backendMessage}`
            : `Não foi possível criar a cobrança na Fruitfy (HTTP ${response.status}).`
        );
      }

      const parsedPix = getPixChargeFromResponse(responseJson);
      if (!parsedPix) {
        const availableKeys = Object.keys(responseJson?.data ?? responseJson ?? {}).join(', ');
        throw new Error(`A Fruitfy não retornou o código PIX esperado. Campos recebidos: ${availableKeys || 'nenhum'}.`);
      }

      setPixData(parsedPix);
      setOrderStatus('waiting_payment');
      setPaymentStep('success');
      onOrderCreated?.();
    } catch (error: any) {
      console.error('Erro ao criar cobrança PIX:', error);
      setPixError(error?.message || 'Erro ao gerar cobrança PIX. Tente novamente.');
    } finally {
      setIsCreatingPix(false);
    }
  };

  useEffect(() => {
    if (paymentStep !== 'success' || !pixData?.orderId || hasRedirectedAfterPayment.current) {
      return undefined;
    }

    const postPaymentUrl =
      ((import.meta.env.VITE_POST_PAYMENT_REDIRECT_URL as string) || '').trim() || DEFAULT_POST_PAYMENT_URL;
    const apiBase = ((import.meta.env.VITE_API_URL as string) || '').replace(/\/$/, '');

    let isCancelled = false;
    let inFlight = false;
    let intervalId: ReturnType<typeof setInterval>;

    const checkOrderStatus = async () => {
      if (isCancelled || hasRedirectedAfterPayment.current || inFlight) return;
      inFlight = true;
      try {
        const path = `/api/order/${encodeURIComponent(String(pixData.orderId))}`;
        const url = apiBase ? `${apiBase}${path}` : path;
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) return;

        const orderResponse = await safeJsonFromResponse(response);
        const data = orderResponse?.data ?? orderResponse;
        const status =
          typeof data?.status === 'string'
            ? data.status
            : typeof orderResponse?.status === 'string'
              ? orderResponse.status
              : '';
        if (status) setOrderStatus(status);

        if (!isFruitfyOrderPaid(orderResponse)) {
          if (status === 'canceled' || status === 'failed' || status === 'refused') {
            window.clearInterval(intervalId);
          }
          return;
        }

        hasRedirectedAfterPayment.current = true;
        setOrderStatus('paid');
        window.clearInterval(intervalId);

        window.setTimeout(() => {
          if (isCancelled) return;
          try {
            const nextUrl = new URL(postPaymentUrl);
            const merged = mergeStoredQueryParams(window.location.search || '');
            const params = new URLSearchParams(merged);
            params.set('orderId', String(pixData.orderId));
            try {
              params.set(
                'prefill',
                encodeUpsellCustomerPrefill({
                  n: formData.name.trim(),
                  e: formData.email.trim(),
                  p: normalizePhoneForUpsell(formData.phone),
                  c: onlyDigits(formData.cpf),
                })
              );
            } catch {
              /* só orderId + UTMs */
            }
            nextUrl.search = params.toString();
            window.location.href = nextUrl.toString();
          } catch {
            window.location.href = postPaymentUrl;
          }
        }, REDIRECT_AFTER_PAID_MS);
      } catch (error) {
        console.error('Erro ao consultar status do pedido:', error);
      } finally {
        inFlight = false;
      }
    };

    void checkOrderStatus();
    intervalId = window.setInterval(() => {
      void checkOrderStatus();
    }, POLL_ORDER_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [paymentStep, pixData?.orderId, formData.name, formData.email, formData.phone, formData.cpf]);

  if (paymentStep === 'success') {
    const isPaid = orderStatus === 'paid';

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-slate-50 p-6 flex flex-col items-center"
      >
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-xl overflow-hidden border border-slate-100">
          {/* Header Sucesso */}
          <div className={`${isPaid ? 'bg-green-500' : 'bg-gummy-pink'} p-8 flex flex-col items-center text-white text-center`}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black mb-1">{isPaid ? 'Pagamento Confirmado!' : 'Pedido Reservado!'}</h2>
            <p className="text-white/80 text-sm font-bold uppercase tracking-widest">
              {isPaid ? 'Pedido Aprovado' : 'Aguardando Pagamento'}
            </p>
          </div>

          <div className="p-8 flex flex-col items-center">
            {/* QR Code */}
            <div className="relative mb-8 group">
              <div className="absolute -inset-4 bg-gummy-pink/5 rounded-[40px] blur-xl group-hover:bg-gummy-pink/10 transition-colors" />
              <div className="relative bg-white p-6 rounded-[32px] shadow-2xl border border-slate-50">
                <img 
                  src={pixData?.qrCodeUrl} 
                  alt="PIX QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Valor */}
            <div className="text-center mb-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Valor Total</span>
              <span className="text-4xl font-black text-gummy-dark-purple">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>

            {/* Instruções */}
            <div className="w-full bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
              <h4 className="font-black text-gummy-dark-purple text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-gummy-pink" /> Como pagar?
              </h4>
              <ul className="flex flex-col gap-4">
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 bg-gummy-pink text-white rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5">1</div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Abra o app do seu banco e escolha a opção <span className="text-gummy-dark-purple font-bold">PIX</span>.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 bg-gummy-pink text-white rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5">2</div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Escaneie o <span className="text-gummy-dark-purple font-bold">QR Code</span> acima ou copie o código abaixo.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 bg-gummy-pink text-white rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5">3</div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Confirme os dados e finalize o pagamento. <span className="text-gummy-dark-purple font-bold">Seu pedido será aprovado na hora!</span></p>
                </li>
              </ul>
            </div>

            {/* Botão Copiar */}
            <button 
              onClick={handleCopyPix}
              disabled={isPaid}
              className={`w-full py-5 rounded-full font-black flex items-center justify-center gap-3 transition-all active:scale-95 ${
                copied 
                ? 'bg-green-500 text-white shadow-green-200' 
                : 'bg-gummy-dark-purple text-white shadow-xl shadow-slate-200'
              } disabled:opacity-60`}
            >
              {copied ? (
                <>
                  <Check className="w-6 h-6" /> CÓDIGO COPIADO!
                </>
              ) : (
                <>
                  <Copy className="w-6 h-6" /> COPIAR CÓDIGO PIX
                </>
              )}
            </button>

            {/* Timer */}
            <div className="mt-8 flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <Clock className="w-4 h-4" />
              {isPaid ? 'Pagamento recebido com sucesso' : 'O código expira em 30 minutos'}
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-8 text-gummy-pink font-black text-sm uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          Voltar para a Loja
        </button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-white p-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gummy-dark-purple" />
        </button>
        <img 
          src="https://i.ibb.co/JYBVHhH/image.png" 
          alt="Gummy Original" 
          className="h-6 object-contain"
          referrerPolicy="no-referrer"
        />
        <div className="w-10" />
      </div>

      <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
        {/* Resumo do Pedido */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <h3 className="font-black text-gummy-dark-purple mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gummy-pink" /> Resumo do Pedido
          </h3>
          <ul className="flex flex-col gap-4">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-3 items-center">
                <img
                  src={line.img}
                  alt=""
                  className="w-16 h-16 object-contain bg-slate-50 rounded-2xl p-2 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-xs text-gummy-dark-purple leading-tight">
                    {line.count > 1 ? `${line.title} ×${line.count}` : line.title}
                  </h4>
                  <span className="text-gummy-pink font-black text-base">
                    R$ {formatMoneyBR(lineSubtotalBRL(line))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Dados Pessoais */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <h3 className="font-black text-gummy-dark-purple mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gummy-pink" /> Dados Pessoais
          </h3>
          <div className="grid gap-3">
            <input 
              type="text" 
              placeholder="Nome Completo" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-gummy-pink transition-colors"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input 
              type="email" 
              placeholder="E-mail" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-gummy-pink transition-colors"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
              <input 
                type="text" 
                placeholder="CPF" 
                className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none transition-colors ${
                  cpfError ? 'border-red-500 focus:border-red-500' : 'border-slate-100 focus:border-gummy-pink'
                }`}
                value={formatCpf(formData.cpf)}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                onBlur={() => setCpfTouched(true)}
                inputMode="numeric"
                maxLength={14}
              />
              {cpfError && (
                <p className="text-xs text-red-600 font-bold px-1">
                  {cpfInvalidChecksum
                    ? 'CPF inválido. Confira os números.'
                    : 'Digite o CPF completo (11 dígitos).'}
                </p>
              )}
              </div>
              <input 
                type="text" 
                placeholder="WhatsApp" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-gummy-pink transition-colors"
                value={formatPhone(formData.phone)}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                inputMode="numeric"
                maxLength={15}
              />
            </div>
          </div>
        </section>

        {/* Entrega */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <h3 className="font-black text-gummy-dark-purple mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gummy-pink" /> Endereço de Entrega
          </h3>
          <div className="grid gap-3">
            <div className="relative flex flex-col gap-1">
              <input 
                type="text" 
                placeholder="CEP" 
                className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none transition-colors ${
                  cepError ? 'border-red-500 focus:border-red-500' : 'border-slate-100 focus:border-gummy-pink'
                }`}
                value={formatCep(formData.cep)}
                onChange={handleCepChange}
                onBlur={() => setCepTouched(true)}
                inputMode="numeric"
                maxLength={9}
              />
              {loadingCep && <Loader2 className="w-5 h-5 text-gummy-pink animate-spin absolute right-4 top-4" />}
              {cepLengthError && (
                <p className="text-xs text-red-600 font-bold px-1">CEP deve ter 8 dígitos.</p>
              )}
              {!cepLengthError && cepApiInvalid && cepDigits.length === 8 && (
                <p className="text-xs text-red-600 font-bold px-1">CEP não encontrado. Verifique o número.</p>
              )}
            </div>
            <input 
              type="text" 
              placeholder="Rua / Logradouro" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-gummy-pink transition-colors"
              value={formData.street}
              onChange={(e) => setFormData({...formData, street: e.target.value})}
            />
            <div className="grid grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Nº" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-gummy-pink transition-colors"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Compl." 
                className="col-span-2 w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-gummy-pink transition-colors"
                value={formData.complement}
                onChange={(e) => setFormData({...formData, complement: e.target.value})}
              />
            </div>
            <input 
              type="text" 
              placeholder="Bairro" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-gummy-pink transition-colors"
              value={formData.neighborhood}
              onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
            />
            <div className="grid grid-cols-4 gap-3">
              <input 
                type="text" 
                placeholder="Cidade" 
                className="col-span-3 w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-gummy-pink transition-colors"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="UF" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-gummy-pink transition-colors text-center"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Order bumps */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <h3 className="font-black text-gummy-dark-purple mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gummy-pink" /> Ofertas especiais
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mb-4 leading-snug">
            Adicione ao seu pedido com preço especial:
          </p>
          <div className="flex flex-col gap-3">
            {CHECKOUT_ORDER_BUMPS.map((b) => {
              const selected = !!bumpSelections[b.id];
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    setBumpSelections((prev) => ({ ...prev, [b.id]: !prev[b.id] }))
                  }
                  className={`flex gap-3 items-start w-full text-left rounded-2xl border-2 p-3 transition-all ${
                    selected
                      ? 'border-gummy-pink bg-gummy-pink/5 shadow-sm'
                      : 'border-slate-100 bg-slate-50/50 hover:border-gummy-pink/30'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 mt-0.5 ${
                      selected
                        ? 'border-gummy-pink bg-gummy-pink text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selected && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <img
                    src={b.img}
                    alt=""
                    className="h-16 w-16 flex-shrink-0 rounded-xl bg-white object-contain p-1 border border-slate-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-xs text-gummy-dark-purple leading-tight">
                      {b.title}
                    </p>
                    <p className="text-[11px] text-slate-600 font-semibold leading-snug mt-1.5">
                      {b.description}
                    </p>
                    <p className="text-gummy-pink font-black text-sm mt-2">
                      R$ {b.price}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Frete */}
        {cepDigits.length === 8 && !cepApiInvalid && (
          <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
            <h3 className="font-black text-gummy-dark-purple mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-gummy-pink" /> Opções de Frete
            </h3>
            <div className="grid gap-3">
              <button 
                onClick={() => setShipping('free')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${shipping === 'free' ? 'border-gummy-pink bg-gummy-pink/5' : 'border-slate-100 bg-white'}`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-black text-gummy-dark-purple">Frete Grátis</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">7 a 12 dias úteis</span>
                </div>
                <span className="text-green-500 font-black text-sm uppercase">Grátis</span>
              </button>
              <button 
                onClick={() => setShipping('sedex')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${shipping === 'sedex' ? 'border-gummy-pink bg-gummy-pink/5' : 'border-slate-100 bg-white'}`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-black text-gummy-dark-purple">SEDEX</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">2 a 4 dias úteis</span>
                </div>
                <span className="text-gummy-dark-purple font-black text-sm">R$ 19,54</span>
              </button>
            </div>
          </section>
        )}

        {/* Pagamento */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <h3 className="font-black text-gummy-dark-purple mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gummy-pink" /> Método de Pagamento
          </h3>
          <div className="p-4 rounded-2xl border-2 border-gummy-pink bg-gummy-pink/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <QrCode className="w-6 h-6 text-gummy-pink" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-gummy-dark-purple">PIX</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Aprovação imediata</span>
              </div>
            </div>
            <div className="w-5 h-5 rounded-full border-4 border-gummy-pink bg-white" />
          </div>
        </section>

        {/* Resumo Final */}
        <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-[32px] mt-4">
          <h3 className="font-black text-gummy-dark-purple mb-4 text-sm uppercase tracking-widest">Resumo do Pedido</h3>
          <div className="flex flex-col gap-3 mb-6">
            {bumpsSubtotalCents > 0 ? (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Produtos</span>
                  <span className="text-gummy-dark-purple font-bold text-right">
                    R$ {formatMoneyBR(cartSubtotalCents / 100)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Ofertas especiais</span>
                  <span className="text-gummy-dark-purple font-bold text-right">
                    R$ {formatMoneyBR(bumpsSubtotalCents / 100)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Subtotal</span>
                  <span className="text-gummy-dark-purple font-bold text-right">
                    R$ {formatMoneyBR(subtotal)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">Subtotal</span>
                <span className="text-gummy-dark-purple font-bold text-right">
                  R$ {formatMoneyBR(subtotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Frete</span>
              <span className={`font-bold text-right ${shipping === 'free' ? 'text-green-500' : 'text-gummy-dark-purple'}`}>
                {shipping === 'free' ? 'Grátis' : shipping === 'sedex' ? 'R$ 19,54' : 'A calcular'}
              </span>
            </div>
            <div className="h-px bg-slate-100 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-gummy-dark-purple font-black">Total</span>
              <span className="text-2xl font-black text-gummy-pink">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          
          <button 
            disabled={
              isCreatingPix ||
              !shipping ||
              !formData.name ||
              !formData.email ||
              onlyDigits(formData.cpf).length !== 11 ||
              !isValidCpf(formData.cpf) ||
              onlyDigits(formData.phone).length < 10 ||
              cepDigits.length !== 8 ||
              cepApiInvalid ||
              !formData.street ||
              !formData.number ||
              !formData.neighborhood ||
              !formData.city ||
              !formData.state
            }
            onClick={createPixCharge}
            className="w-full btn-pink-gradient text-white py-5 rounded-full font-black text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:grayscale"
          >
            {isCreatingPix ? 'GERANDO PIX...' : 'FINALIZAR PAGAMENTO'}
          </button>
          {pixError && (
            <p className="mt-3 text-xs text-red-500 font-bold text-center">{pixError}</p>
          )}
          
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-green-500" /> Compra 100% Segura e Criptografada
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLines, setCheckoutLines] = useState<CartLine[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const cartItemCount = cart.reduce((sum, line) => sum + line.count, 0);

  useEffect(() => {
    persistFullQuery(window.location.search);
    persistUtmSearch(window.location.search);
  }, []);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const id = cartLineId(product);
      const idx = prev.findIndex((l) => l.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], count: next[idx].count + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id,
          title: product.title,
          img: product.img,
          price: product.price,
          count: 1,
        },
      ];
    });
    setCartOpen(true);
  };

  const openCheckoutFromCart = () => {
    if (cart.length === 0) return;
    setCheckoutLines(cart.map((l) => ({ ...l })));
    setCartOpen(false);
    setIsCheckoutOpen(true);
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-x-hidden selection:bg-gummy-pink selection:text-white">
      <AnimatePresence mode="wait">
        {isCheckoutOpen ? (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <Checkout
              lines={checkoutLines}
              onClose={() => setIsCheckoutOpen(false)}
              onOrderCreated={() => setCart([])}
            />
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Header cartItemCount={cartItemCount} onOpenCart={() => setCartOpen(true)} />
            <main>
              <Hero />
              <CategoryTabs />
              <ProductBenefits />
              <InfluencerCarousel />
              <CategoriesGrid />
              <BestSellers onAddToCart={addToCart} />
              <WhatsappCTA />
              <BlogSection />
            </main>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
      {!isCheckoutOpen && (
        <CartDrawer
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          lines={cart}
          setLines={setCart}
          onCheckout={openCheckoutFromCart}
        />
      )}
    </div>
  );
}
