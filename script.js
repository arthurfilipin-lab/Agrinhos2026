/**
 * AgroForte e o Futuro Sustentável - Core Script
 * @version 1.1.0
 * @author Senior Front-End Developer
 * @license MIT
 * 
 * Design Patterns: Module Pattern (IIFE), Event Delegation, Performance-First Scroll.
 */

(() => {
    'use strict';

    // ==========================================
    // CONFIGURAÇÕES E ESTADOS GLOBAIS
    // ==========================================
    const CONFIG = {
        selectors: {
            header: '[data-header]',
            menuToggle: '[data-menu-toggle]',
            navLinks: '[data-nav-links]',
            scrollLinks: 'a[href^="#"]',
            revealElements: '[data-reveal], .card-pilar, .bloco-tecnologia',
            contactForm: '[data-form="contact"]'
        },
        classes: {
            headerScrolled: 'header--scrolled',
            menuOpen: 'menu-toggle--open',
            navActive: 'nav-links--active',
            revealInit: 'reveal-init',
            revealActive: 'reveal-active',
            inputError: 'input--error',
            errorMessage: 'error-feedback'
        },
        scrollThreshold: 50,
        toastDuration: 4000
    };

    // ==========================================
    // 1. MENU MOBILE (HAMBÚRGUER & ACESSIBILIDADE)
    // ==========================================
    const initNavigation = () => {
        const toggleBtn = document.querySelector(CONFIG.selectors.menuToggle);
        const navMenu = document.querySelector(CONFIG.selectors.navLinks);

        if (!toggleBtn || !navMenu) return;

        const handleMenuState = (isOpen) => {
            toggleBtn.setAttribute('aria-expanded', isOpen);
            toggleBtn.classList.toggle(CONFIG.classes.menuOpen, isOpen);
            navMenu.classList.toggle(CONFIG.classes.navActive, isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : ''; // Previne scroll de fundo
        };

        // Toggle Click
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
            handleMenuState(!isOpen);
        });

        // Event Delegation para links e cliques externos
        document.addEventListener('click', (e) => {
            const isMenuOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
            if (!isMenuOpen) return;

            // Fecha ao clicar em um link interno ou fora do menu
            if (e.target.closest(CONFIG.selectors.scrollLinks) || (!e.target.closest(CONFIG.selectors.navLinks) && !e.target.closest(CONFIG.selectors.menuToggle))) {
                handleMenuState(false);
            }
        });
    };

    // ==========================================
    // 2. PERFORMANCE-FIRST SCROLL (HEADER EFFECT)
    // ==========================================
    const initHeaderScroll = () => {
        const header = document.querySelector(CONFIG.selectors.header);
        if (!header) return;

        let lastKnownScrollPosition = 0;
        let ticking = false;

        const updateHeaderClass = (scrollPos) => {
            const isScrolled = scrollPos > CONFIG.scrollThreshold;
            header.classList.toggle(CONFIG.classes.headerScrolled, isScrolled);
        };

        // Scroll Passivo com RequestAnimationFrame para garantir 60 FPS
        window.addEventListener('scroll', () => {
            lastKnownScrollPosition = window.scrollY;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateHeaderClass(lastKnownScrollPosition);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    };

    // ==========================================
    // 3. ROLAGEM SUAVE COM OFFSET DINÂMICO
    // ==========================================
    const initSmoothScroll = () => {
        const header = document.querySelector(CONFIG.selectors.header);

        document.addEventListener('click', (e) => {
            const trigger = e.target.closest(CONFIG.selectors.scrollLinks);
            if (!trigger) return;

            const targetId = trigger.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            e.preventDefault();

            const headerHeight = header ? header.offsetHeight : 0;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Gerencia o foco para leitores de tela após o scroll
            targetElement.setAttribute('tabindex', '-1');
            targetElement.focus({ preventScroll: true });
        });
    };

    // ==========================================
    // 4. ANIMAÇÃO DE SURGIMENTO (INTERSECTION OBSERVER)
    // ==========================================
    const initScrollAnimations = () => {
        const elements = document.querySelectorAll(CONFIG.selectors.revealElements);
        if (elements.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -8% 0px', // Dispara um pouco antes de entrar totalmente na viewport
            threshold: 0.1
        };

        const onIntersection = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(CONFIG.classes.revealActive);
                    observer.unobserve(entry.target); // Otimização: desobserva após animar
                }
            });
        };

        const observer = new IntersectionObserver(onIntersection, observerOptions);

        elements.forEach(element => {
            element.classList.add(CONFIG.classes.revealInit);
            observer.observe(element);
        });
    };

    // ==========================================
    // 5. VALIDAÇÃO DE FORMULÁRIO E TOAST UI
    // ==========================================
    const initFormValidation = () => {
        const form = document.querySelector(CONFIG.selectors.contactForm);
        if (!form) return;

        const validators = {
            email: (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim()),
            required: (value) => value.trim().length > 0
        };

        const createErrorElement = (message) => {
            const errorSpan = document.createElement('span');
            errorSpan.className = CONFIG.classes.errorMessage;
            errorSpan.setAttribute('role', 'alert');
            errorSpan.textContent = message;
            return errorSpan;
        };

        const validateField = (input) => {
            const value = input.value;
            let errorMessage = '';

            if (input.hasAttribute('required') && !validators.required(value)) {
                errorMessage = 'Este campo não pode ficar vazio.';
            } else if (input.type === 'email' && !validators.email(value)) {
                errorMessage = 'Insira um endereço de e-mail válido.';
            }

            // Remove erro existente se houver
            const parent = input.parentElement;
            const existingError = parent.querySelector(`.${CONFIG.classes.errorMessage}`);
            if (existingError) existingError.remove();
            input.classList.remove(CONFIG.classes.inputError);

            if (errorMessage) {
                input.classList.add(CONFIG.classes.inputError);
                parent.appendChild(createErrorElement(errorMessage));
                return false;
            }

            return true;
        };

        const showToast = () => {
            const toast = document.createElement('div');
            toast.setAttribute('role', 'status');
            toast.style.cssText = `
                position: fixed; bottom: 24px; right: 24px; z-index: 1000;
                background: #1e4620; color: #fff; padding: 16px 28px;
                border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                font-family: system-ui, -apple-system, sans-serif; font-weight: 500;
                display: flex; align-items: center; gap: 12px;
                transform: translateY(30px); opacity: 0; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            `;
            
            toast.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span>Mensagem enviada com sucesso!</span>
            `;

            document.body.appendChild(toast);

            // Trigger Animation
            requestAnimationFrame(() => {
                toast.style.transform = 'translateY(0)';
                toast.style.opacity = '1';
            });

            // Destruição controlada
            setTimeout(() => {
                toast.style.transform = 'translateY(20px)';
                toast.style.opacity = '0';
                toast.addEventListener('transitionend', () => toast.remove());
            }, CONFIG.toastDuration);
        };

        // Validação Real-time (UX refinada)
        form.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                validateField(e.target);
            }
        });

        // Submit Handler
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fields = form.querySelectorAll('input, textarea');
            let isFormValid = true;

            fields.forEach(field => {
