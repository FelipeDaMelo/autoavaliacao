"use client";

import { useState } from 'react';
import { FaStar } from 'react-icons/fa';

// Define as propriedades que o nosso componente vai receber
type StarRatingProps = {
  count?: number; // Quantidade de estrelas (opcional, padrão 10)
  rating: number; // A nota atual (de 0 a count)
  onRatingChange: (newRating: number) => void; // Função para ser chamada quando a nota mudar
};

const StarRating = ({ count = 5, rating, onRatingChange }: StarRatingProps) => {
  // Estado para controlar o efeito "hover" (quando o mouse passa por cima)
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center space-x-1">
      {[...Array(count)].map((_, index) => {
        const ratingValue = index + 1;

        return (
          <label key={index}>
            {/* O input de rádio é invisível, mas importante para acessibilidade */}
            <input
              type="radio"
              name="rating"
              className="hidden"
              value={ratingValue}
              onClick={() => onRatingChange(ratingValue)}
            />
            <FaStar
              className="cursor-pointer transition-colors"
              color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
              size={28}
              onMouseEnter={() => setHover(ratingValue)}
              onMouseLeave={() => setHover(0)}
            />
          </label>
        );
      })}
      {/* Botão para limpar a nota (dar nota 0) */}
      </div>
  );
};

export default StarRating;