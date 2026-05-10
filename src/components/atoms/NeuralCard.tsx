import React from 'react';
import styled, { keyframes } from 'styled-components';


const neuralPulse = keyframes`
  0% {
    box-shadow: 0 0 0px 0px var(--color-primary), 0 0 0px 0px var(--color-accent);
    transform: scale(1);
  }
  60% {
    box-shadow: 0 0 32px 8px var(--color-primary), 0 0 64px 16px var(--color-accent);
    transform: scale(1.035);
  }
  100% {
    box-shadow: 0 0 0px 0px var(--color-primary), 0 0 0px 0px var(--color-accent);
    transform: scale(1);
  }
`;


const flicker = keyframes`
  0%, 100% { opacity: 0.7; filter: blur(0.5px); }
  50% { opacity: 1; filter: blur(2px); }
`;

const CardContainer = styled.div<{ $themeName: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 260px;
  max-width: 400px;
  width: 100%;
  min-height: 220px;
  padding: 2rem 1.5rem;
  border-radius: 2rem;
  background: ${({ $themeName }) =>
    $themeName === 'dark'
      ? 'linear-gradient(135deg, rgba(40,30,60,0.85) 60%, rgba(80,60,120,0.7) 100%)'
      : $themeName === 'neutral'
        ? 'linear-gradient(135deg, rgba(255,230,180,0.85) 60%, rgba(255,245,200,0.7) 100%)'
        : 'linear-gradient(135deg, rgba(230,240,255,0.85) 60%, rgba(200,220,255,0.7) 100%)'};
  box-shadow: 0 4px 32px 0
    ${({ $themeName }) =>
      $themeName === 'dark'
        ? 'rgba(139,92,246,0.18)'
        : $themeName === 'neutral'
          ? 'rgba(245,158,11,0.12)'
          : 'rgba(245,158,11,0.12)'};
  border: 2px solid;
  border-image: ${({ $themeName }) =>
    $themeName === 'dark'
      ? 'linear-gradient(90deg, #D97706, #B45309, #92400E) 1'
      : $themeName === 'neutral'
      ? 'var(--syn-gradient-amber-border) 1'
        : 'var(--syn-gradient-amber-border) 1'};
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  transition:
    box-shadow 0.4s,
    border-radius 0.4s,
    background 0.4s,
    border 0.4s,
    transform 0.2s;
  cursor: pointer;
  overflow: visible;

  &:hover {
    animation: ${neuralPulse} 1.2s cubic-bezier(0.4, 0.2, 0.2, 1);
    box-shadow:
      0 0 48px 8px var(--color-primary),
      0 0 96px 16px var(--color-accent);
    transform: scale(1.035);
  }

  @media (max-width: 600px) {
    min-width: 180px;
    max-width: 98vw;
    padding: 1.2rem 0.5rem;
    border-radius: 1.2rem;
  }
`;

const IconWrapper = styled.div`
  width: 44px;
  height: 44px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 100%;
    height: 100%;
    stroke: var(--color-primary);
    filter: drop-shadow(0 0 8px var(--color-accent));
  }
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-align: center;
  color: var(--color-text);
`;

const Description = styled.p`
  font-size: 1rem;
  font-weight: 400;
  margin: 0 0 0.5rem 0;
  text-align: center;
  color: var(--color-text-secondary);
  opacity: 0.85;
`;


const NeuronNode = styled.span<{ $pos: string; $themeName: string }>`
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $themeName }) =>
    $themeName === 'dark'
      ? 'radial-gradient(circle, #B45309 60%, #92400E 100%)'
      : $themeName === 'neutral'
      ? 'radial-gradient(circle, #F59E0B 60%, #D97706 100%)'
        : 'radial-gradient(circle, #FBBF24 60%, #F59E0B 100%)'};
  box-shadow: 0 0 12px 2px
    ${({ $themeName }) =>
      $themeName === 'dark' ? '#B45309' : $themeName === 'neutral' ? '#F59E0B' : '#FBBF24'};
  opacity: 0.7;
  animation: ${flicker} 2.2s infinite alternate;
  ${({ $pos }) => {
    switch ($pos) {
      case 'tl':
        return 'top: 10px; left: 10px;';
      case 'tr':
        return 'top: 10px; right: 10px;';
      case 'bl':
        return 'bottom: 10px; left: 10px;';
      case 'br':
        return 'bottom: 10px; right: 10px;';
      default:
        return '';
    }
  }}
`;

export interface NeuralCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  themeName: string;
}

export const NeuralCard: React.FC<NeuralCardProps> = ({ title, description, icon, themeName }) => (
  <CardContainer $themeName={themeName}>
    <NeuronNode $pos="tl" $themeName={themeName} />
    <NeuronNode $pos="tr" $themeName={themeName} />
    <NeuronNode $pos="bl" $themeName={themeName} />
    <NeuronNode $pos="br" $themeName={themeName} />
    <IconWrapper>{icon}</IconWrapper>
    <Title>{title}</Title>
    <Description>{description}</Description>
  </CardContainer>
);
