import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, NavLink, useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  Search, ShoppingCart, User, Menu, X, Truck, ShieldCheck, CircleDollarSign, LockKeyhole,
  Plus, Pencil, Trash2, Package, LayoutDashboard, Tags, LogOut, Minus, MessageCircle,
  Sparkles, Gift, Heart, Upload, LoaderCircle, ImagePlus, ClipboardList, Users, ChevronRight,
  MapPin, Store, CheckCircle2, Clock3, Ban, Eye, Phone, Mail, TrendingUp,
  AlertTriangle, ArrowUpDown, Settings, Save, Palette, Globe2, CreditCard, FileSpreadsheet, Download, CalendarDays, TicketPercent, Power, Copy, ExternalLink, RefreshCw, Boxes, ArrowDownToLine, ArrowUpFromLine, History
} from 'lucide-react'
import logo from './assets/logo-bellaten-cropped.png'
import { categories as fallbackCategories } from './data'
import { supabase } from './supabase'

const DEFAULT_SETTINGS = {
  id: 1,
  store_name: 'BellaTen',
  whatsapp: '5511940746340',
  instagram: 'https://instagram.com/bellaten.oficial',
  facebook: '',
  address: '',
  pix_key: '',
  business_hours: '',
  footer_text: 'Seu novo jeito de comprar beleza.',
  seo_title: 'BellaTen | Beleza e cosméticos',
  seo_description: 'Produtos de beleza escolhidos com carinho para você.',
  logo_url: '',
  banner_desktop_url: '',
  banner_mobile_url: '',
  primary_color: '#e36b91',
  secondary_color: '#d9a55f',
  delivery_enabled: true,
  pickup_enabled: true
}

const normalizePhone = value => String(value || '').replace(/\D/g, '')
const normalizeInstagram = value => {
  const text = String(value || '').trim()
  if (!text) return ''
  if (text.startsWith('http://') || text.startsWith('https://')) return text
  return `https://instagram.com/${text.replace(/^@/, '')}`
}
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
const dateTime = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const ORDER_STATUS = {
  recebido: { label: 'Recebido', icon: Clock3 },
  separacao: { label: 'Em separação', icon: Package },
  entrega: { label: 'Saiu para entrega', icon: Truck },
  finalizado: { label: 'Finalizado', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', icon: Ban },

  // Compatibilidade com pedidos criados antes desta atualização.
  novo: { label: 'Recebido', icon: Clock3 },
  atendimento: { label: 'Em separação', icon: Package }
}

const ORDER_STATUS_OPTIONS = [
  ['recebido', 'Recebido'],
  ['separacao', 'Em separação'],
  ['entrega', 'Saiu para entrega'],
  ['finalizado', 'Finalizado'],
  ['cancelado', 'Cancelado']
]

const TRACKING_STEPS = [
  {
    value: 'recebido',
    label: 'Pedido recebido',
    description: 'A loja recebeu seu pedido e vai iniciar a preparação.',
    icon: ClipboardList
  },
  {
    value: 'separacao',
    label: 'Em separação',
    description: 'Os produtos do pedido estão sendo separados.',
    icon: Package
  },
  {
    value: 'entrega',
    label: 'Saiu para entrega',
    description: 'Seu pedido está a caminho.',
    icon: Truck
  },
  {
    value: 'finalizado',
    label: 'Pedido finalizado',
    description: 'Pedido entregue ou retirado com sucesso.',
    icon: CheckCircle2
  }
]

const normalizeOrderStatus = status =>
  status === 'novo'
    ? 'recebido'
    : status === 'atendimento'
      ? 'separacao'
      : status

const trackingUrl = token =>
  token ? `${window.location.origin}/#/pedido/${token}` : ''

const PAGE_SIZE = 8


function useStore() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('bellaten_cart') || '[]'))
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('bellaten_favorites') || '[]'))

  const loadData = async () => {
    setLoading(true)

    try {
      // Produtos e categorias são os dados essenciais da loja.
      // Eles não podem ficar esperando a consulta opcional de configurações.
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false }),

        supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true })
      ])

      if (productsResult.error) {
        console.error('Erro ao carregar produtos:', productsResult.error)
      }

      if (categoriesResult.error) {
        console.error('Erro ao carregar categorias:', categoriesResult.error)
      }

      setProducts(productsResult.data || [])
      setCategories(
        categoriesResult.data?.length
          ? categoriesResult.data
          : fallbackCategories.map(([name, image], index) => ({
              id: `fallback-${index}`,
              name,
              image,
              active: true,
              display_order: index + 1
            }))
      )

      // Configurações são opcionais. Caso a tabela ainda não exista,
      // a loja continua funcionando com os valores padrão.
      try {
        const settingsResult = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle()

        if (settingsResult.error) {
          console.warn(
            'Configurações da loja não carregadas. Usando valores padrão:',
            settingsResult.error
          )
          setSettings(DEFAULT_SETTINGS)
        } else {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...(settingsResult.data || {})
          })
        }
      } catch (settingsError) {
        console.warn(
          'Falha ao consultar configurações. Usando valores padrão:',
          settingsError
        )
        setSettings(DEFAULT_SETTINGS)
      }
    } catch (loadError) {
      console.error('Falha ao carregar os dados da loja:', loadError)
      setProducts([])
      setCategories(
        fallbackCategories.map(([name, image], index) => ({
          id: `fallback-${index}`,
          name,
          image,
          active: true,
          display_order: index + 1
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => localStorage.setItem('bellaten_cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('bellaten_favorites', JSON.stringify(favorites)), [favorites])
  return {
    products,
    categories,
    settings,
    setSettings,
    loading,
    reload: loadData,
    cart,
    setCart,
    favorites,
    setFavorites
  }
}

function App() {
  const store = useStore()
  return <Routes>
    <Route path="/pedido/:trackingToken" element={<OrderTracking settings={store.settings} />} />
    <Route path="/admin/*" element={<Admin {...store} />} />
    <Route path="/*" element={<Storefront {...store} />} />
  </Routes>
}


function OrderTracking({ settings }) {
  const { trackingToken } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTracking = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: trackingError } = await supabase.rpc(
        'get_order_tracking',
        { tracking_token_input: trackingToken }
      )

      if (trackingError) throw trackingError
      if (!data) throw new Error('Pedido não encontrado.')

      setOrder(data)
    } catch (trackingError) {
      setError(
        trackingError.message ||
        'Não foi possível localizar este pedido.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTracking()
  }, [trackingToken])

  const currentStatus = normalizeOrderStatus(order?.status)
  const currentIndex = TRACKING_STEPS.findIndex(
    step => step.value === currentStatus
  )
  const storeName = settings?.store_name || DEFAULT_SETTINGS.store_name
  const storeLogo = settings?.logo_url || logo
  const whatsapp = normalizePhone(
    settings?.whatsapp || DEFAULT_SETTINGS.whatsapp
  )

  return <main className="tracking-page">
    <header className="tracking-header">
      <Link to="/" className="tracking-brand">
        <img src={storeLogo} alt={storeName} />
      </Link>
      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle /> Falar com a loja
      </a>
    </header>

    <section className="tracking-container">
      {loading && <div className="tracking-state">
        <LoaderCircle className="spin" />
        <h1>Consultando pedido...</h1>
      </div>}

      {!loading && error && <div className="tracking-state error">
        <Ban />
        <h1>Pedido não encontrado</h1>
        <p>{error}</p>
        <Link to="/" className="primary-btn">Voltar para a loja</Link>
      </div>}

      {!loading && order && <>
        <div className="tracking-hero">
          <div>
            <span>Acompanhamento</span>
            <h1>Pedido #{order.order_number}</h1>
            <p>Olá, {order.customer_name}. Veja abaixo o andamento do seu pedido.</p>
          </div>
          <button type="button" onClick={loadTracking}>
            <RefreshCw /> Atualizar
          </button>
        </div>

        {currentStatus === 'cancelado'
          ? <div className="tracking-cancelled">
              <Ban />
              <div>
                <strong>Pedido cancelado</strong>
                <p>Entre em contato com a loja para mais informações.</p>
              </div>
            </div>
          : <div className="tracking-timeline">
              {TRACKING_STEPS.map((step, index) => {
                const Icon = step.icon
                const completed = index <= currentIndex
                const active = index === currentIndex

                return <article
                  key={step.value}
                  className={`${completed ? 'completed' : ''} ${active ? 'active' : ''}`}
                >
                  <div className="tracking-step-icon">
                    <Icon />
                  </div>
                  <div>
                    <strong>{step.label}</strong>
                    <p>{step.description}</p>
                  </div>
                </article>
              })}
            </div>}

        <div className="tracking-grid">
          <section className="tracking-card">
            <h2>Resumo do pedido</h2>
            <div className="tracking-items">
              {(order.items || []).map((item, index) => <div key={index}>
                <img
                  src={item.image || 'https://placehold.co/70x70?text=Produto'}
                  alt={item.name}
                />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.quantity} × {money(item.price)}</small>
                </span>
                <b>{money(Number(item.quantity) * Number(item.price))}</b>
              </div>)}
            </div>

            {Number(order.discount || 0) > 0 && <div className="tracking-price-row">
              <span>Subtotal</span>
              <strong>{money(order.subtotal)}</strong>
            </div>}

            {Number(order.discount || 0) > 0 && <div className="tracking-price-row discount">
              <span>Desconto {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
              <strong>-{money(order.discount)}</strong>
            </div>}

            <div className="tracking-total">
              <span>Total</span>
              <strong>{money(order.total)}</strong>
            </div>
          </section>

          <section className="tracking-card">
            <h2>Informações</h2>
            <dl className="tracking-info">
              <div>
                <dt>Data do pedido</dt>
                <dd>{dateTime(order.created_at)}</dd>
              </div>
              <div>
                <dt>Forma de recebimento</dt>
                <dd>{order.delivery_type === 'entrega' ? 'Entrega' : 'Retirada'}</dd>
              </div>
              {order.delivery_type === 'entrega' && <div>
                <dt>Endereço</dt>
                <dd>{order.address}</dd>
              </div>}
              <div>
                <dt>Pagamento</dt>
                <dd className="capitalize">{order.payment_method}</dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd>{dateTime(order.updated_at || order.created_at)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </>}
    </section>
  </main>
}

function Storefront({ products, categories, settings, loading, cart, setCart, favorites, setFavorites, reload }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [sort, setSort] = useState('recentes')
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const filtered = useMemo(() => {
    const list = products.filter(p =>
      (category === 'Todos' || p.category === category) &&
      String(p.name || '').toLowerCase().includes(query.toLowerCase()) &&
      p.active !== false &&
      (!favoritesOnly || favorites.includes(p.id))
    )
    return [...list].sort((a, b) => {
      if (sort === 'menor') return Number(a.price) - Number(b.price)
      if (sort === 'maior') return Number(b.price) - Number(a.price)
      if (sort === 'nome') return String(a.name).localeCompare(String(b.name))
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
  }, [products, category, query, sort, favoritesOnly, favorites])

  const qty = cart.reduce((acc, item) => acc + item.qty, 0)
  const addToCart = product => setCart(prev => {
    const found = prev.find(i => i.id === product.id)
    return found ? prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + 1, Number(product.stock)) } : i) : [...prev, { ...product, qty: 1 }]
  })
  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, Math.min(Number(i.stock), i.qty + delta)) } : i).filter(i => i.qty > 0))
  const toggleFavorite = id => setFavorites(prev =>
    prev.includes(id)
      ? prev.filter(item => item !== id)
      : [...prev, id]
  )

  const toggleFavoritesView = () => {
    if (favoritesOnly) {
      setFavoritesOnly(false)
      setCategory('Todos')
    } else {
      setFavoritesOnly(true)
    }

    requestAnimationFrame(() => {
      document.getElementById('produtos')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }

  const storeName = settings.store_name || DEFAULT_SETTINGS.store_name
  const storeLogo = settings.logo_url || logo
  const whatsapp = normalizePhone(settings.whatsapp || DEFAULT_SETTINGS.whatsapp)
  const instagram = normalizeInstagram(settings.instagram || DEFAULT_SETTINGS.instagram)

  const storefrontStyle = {
    '--pink': settings.primary_color || DEFAULT_SETTINGS.primary_color,
    '--pink2': settings.primary_color || DEFAULT_SETTINGS.primary_color,
    '--gold': settings.secondary_color || DEFAULT_SETTINGS.secondary_color,
    '--hero-desktop': settings.banner_desktop_url
      ? `url("${settings.banner_desktop_url}")`
      : undefined,
    '--hero-mobile': settings.banner_mobile_url
      ? `url("${settings.banner_mobile_url}")`
      : undefined
  }

  useEffect(() => {
    document.title = settings.seo_title || storeName
    const description = document.querySelector('meta[name="description"]')
    if (description) {
      description.setAttribute(
        'content',
        settings.seo_description || DEFAULT_SETTINGS.seo_description
      )
    }
  }, [settings.seo_title, settings.seo_description, storeName])

  return <div className="site-shell" style={storefrontStyle}>
    <header className="header">
      <div className="topbar container">
        <button className="icon-btn mobile-only" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button>
        <Link to="/" className="brand"><img src={storeLogo} alt={storeName} /></Link>
        <div className="search-box desktop-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produtos..." /></div>
        <div className="header-actions">
          <button
            type="button"
            className={`header-link favorite-link ${favoritesOnly ? 'active' : ''}`}
            onClick={toggleFavoritesView}
            aria-pressed={favoritesOnly}
            aria-label={favoritesOnly ? 'Sair dos favoritos e mostrar todos os produtos' : 'Mostrar produtos favoritos'}
            title={favoritesOnly ? 'Mostrar todos os produtos' : 'Mostrar favoritos'}
          >
            <Heart size={19} fill={favoritesOnly ? 'currentColor' : 'none'} />
            <span className="desktop-only">Favoritos</span>
          </button>
          <Link className="header-link desktop-only" to="/admin"><User size={19} /> Entrar</Link>
          <button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingCart size={20} /><span className="desktop-only">Carrinho</span>{qty > 0 && <b>{qty}</b>}</button>
        </div>
      </div>
      <nav className={`nav ${menuOpen ? 'open' : ''}`}><div className="container nav-inner"><a href="#inicio">Início</a><a href="#produtos">Produtos</a><a href="#categorias">Categorias</a><a href="#sobre">Sobre nós</a><a href="#contato">Contato</a><Link to="/admin" className="mobile-only">Painel administrativo</Link></div></nav>
    </header>

    <main>
      <section
        className={`hero ${settings.banner_desktop_url || settings.banner_mobile_url ? 'custom-hero' : ''}`}
        id="inicio"
      ><a className="hero-click" href="#produtos" aria-label="Ver produtos"></a></section>
      <section className="benefits"><div className="container benefits-grid"><Benefit icon={<CircleDollarSign />} title="Preços acessíveis" text="Produtos para todos os bolsos" /><Benefit icon={<ShieldCheck />} title="Qualidade garantida" text="Produtos escolhidos com carinho" /><Benefit icon={<Truck />} title="Entrega rápida" text="Combine diretamente pelo WhatsApp" /><Benefit icon={<LockKeyhole />} title="Compra segura" text="Pedido confirmado com a vendedora" /></div></section>
      {!favoritesOnly && <section className="section container" id="categorias"><div className="section-heading"><span>Explore</span><h2>Categorias</h2><p>Encontre tudo o que você precisa</p></div><div className="categories-grid">{categories.filter(c => c.active !== false).map(c => <button key={c.id || c.name} className={category === c.name ? 'category active' : 'category'} onClick={() => { setCategory(c.name); setFavoritesOnly(false); document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' }) }}><img src={c.image || 'https://placehold.co/500x500?text=Categoria'} alt={c.name} /><strong>{c.name}</strong></button>)}<button className="category" onClick={() => { setCategory('Todos'); setFavoritesOnly(false) }}><span className="category-more">•••</span><strong>Todos</strong></button></div></section>}

      <section className="section products-section" id="produtos"><div className="container">
        <div className="section-heading">
          <span>Catálogo</span>
          <h2>{favoritesOnly ? 'Seus favoritos' : category === 'Todos' ? 'Nossos produtos' : category}</h2>
          <p>{favoritesOnly ? 'Os produtos que você salvou' : 'Escolha seus favoritos'}</p>

          {favoritesOnly && <button
            type="button"
            className="favorites-back-button"
            onClick={() => {
              setFavoritesOnly(false)
              setCategory('Todos')
            }}
          >
            <ChevronRight />
            Ver todos os produtos
          </button>}
        </div>
        <div className="catalog-toolbar"><div className="mobile-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produtos..." /></div><label className="sort-control"><ArrowUpDown size={17} /><select value={sort} onChange={e => setSort(e.target.value)}><option value="recentes">Mais recentes</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="nome">Nome A–Z</option></select></label></div>
        {loading ? <div className="empty">Carregando produtos...</div> : <><div className="products-grid">{filtered.map(p => <ProductCard key={p.id} product={p} favorite={favorites.includes(p.id)} onFavorite={() => toggleFavorite(p.id)} onAdd={() => addToCart(p)} onView={() => setSelectedProduct(p)} />)}</div>{!filtered.length && <div className="empty">
          {favoritesOnly ? 'Você ainda não adicionou produtos aos favoritos.' : 'Nenhum produto encontrado.'}
        </div>}</>}
      </div></section>
      <section className="brand-section" id="sobre"><div className="container brand-panel"><div className="brand-copy"><span className="eyebrow">O universo BellaTen</span><h2>Beleza que combina com você</h2><p>Produtos escolhidos para deixar sua rotina mais bonita, prática e acessível.</p><a className="primary-btn" href="#produtos">Ver produtos</a></div><div className="brand-highlights"><div><Sparkles /><strong>Novidades</strong><span>Achadinhos para renovar sua nécessaire.</span></div><div><Gift /><strong>Para presentear</strong><span>Monte kits lindos e especiais.</span></div><div><Heart /><strong>Com carinho</strong><span>Produtos para todos os estilos.</span></div></div></div></section>
    </main>
    <footer id="contato" className="premium-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <img src={storeLogo} alt={storeName} />
          <p>{settings.footer_text || DEFAULT_SETTINGS.footer_text}</p>
        </div>

        <div className="footer-links">
          <strong>Navegação</strong>
          <a href="#inicio">Início</a>
          <a href="#categorias">Categorias</a>
          <a href="#produtos">Produtos</a>
        </div>

        <div className="footer-contact">
          <strong>Fale com a {storeName}</strong>
          {instagram && <a href={instagram} target="_blank" rel="noreferrer">
            <span className="social-mark">◎</span>
            {String(settings.instagram || '@bellaten.oficial').replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}
          </a>}
          {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
            <MessageCircle /> WhatsApp
          </a>}
          {settings.address && <span className="footer-address"><MapPin /> {settings.address}</span>}
          {settings.business_hours && <span className="footer-address"><Clock3 /> {settings.business_hours}</span>}
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 {storeName}.</span>
        <span>Desenvolvido por NexCode Studio.</span>
      </div>
    </footer>
    {cartOpen && <CartDrawer
      cart={cart}
      setCart={setCart}
      settings={settings}
      onClose={() => setCartOpen(false)}
      updateQty={updateQty}
      onOrderCreated={reload}
    />}
    {selectedProduct && <ProductDetails product={selectedProduct} favorite={favorites.includes(selectedProduct.id)} onFavorite={() => toggleFavorite(selectedProduct.id)} onAdd={() => { addToCart(selectedProduct); setSelectedProduct(null); setCartOpen(true) }} onClose={() => setSelectedProduct(null)} />}
  </div>
}

const Benefit = ({ icon, title, text }) => <div className="benefit">{icon}<div><strong>{title}</strong><span>{text}</span></div></div>
function ProductCard({ product, favorite, onFavorite, onAdd, onView }) {
  return <article className="product-card"><div className="product-image" onClick={onView}><img src={product.image || 'https://placehold.co/600x600?text=Produto'} alt={product.name} />{product.featured && <span>Destaque</span>}<button className={`favorite-button ${favorite ? 'active' : ''}`} onClick={e => { e.stopPropagation(); onFavorite() }} aria-label="Favoritar"><Heart fill={favorite ? 'currentColor' : 'none'} /></button></div><div className="product-info"><small>{product.category}</small><h3 onClick={onView}>{product.name}</h3><div><strong>{money(product.price)}</strong><button disabled={product.stock <= 0} onClick={onAdd} aria-label="Adicionar ao carrinho"><ShoppingCart size={19} /></button></div>{product.stock <= 0 && <small>Produto indisponível</small>}</div></article>
}

function ProductDetails({ product, favorite, onFavorite, onAdd, onClose }) {
  return <div className="modal-backdrop"><div className="product-details-modal"><button className="modal-close" onClick={onClose}><X /></button><div className="product-details-image"><img src={product.image || 'https://placehold.co/700x700?text=Produto'} alt={product.name} /></div><div className="product-details-copy"><small>{product.category}</small><h2>{product.name}</h2><strong className="detail-price">{money(product.price)}</strong><p>{product.description || 'Produto selecionado com carinho pela BellaTen para completar sua rotina de beleza.'}</p><span className={product.stock > 0 ? 'stock-ok' : 'stock-off'}>{product.stock > 0 ? `${product.stock} unidade(s) disponível(is)` : 'Produto indisponível'}</span><div className="detail-actions"><button className={`secondary-btn ${favorite ? 'active' : ''}`} onClick={onFavorite}><Heart fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'Favoritado' : 'Favoritar'}</button><button className="primary-btn" disabled={product.stock <= 0} onClick={onAdd}><ShoppingCart /> Adicionar</button></div></div></div></div>
}

function CartDrawer({ cart, setCart, settings, onClose, updateQty, onOrderCreated }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const total = cart.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)

  const finishOrder = () => {
    setCart([])
    setCheckoutOpen(false)
    onClose()
    onOrderCreated()
  }

  return <>
    <div
      className="drawer-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !checkoutOpen) onClose()
      }}
    >
      <aside
        className="cart-drawer"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="drawer-title">
          <div>
            <small>Seu pedido</small>
            <h2>Carrinho</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar carrinho"
          >
            <X />
          </button>
        </div>

        <div className="cart-list">
          {cart.map(item => <article className="cart-item" key={item.id}>
            <img
              src={item.image || 'https://placehold.co/120x120?text=Produto'}
              alt={item.name}
            />

            <div>
              <strong>{item.name}</strong>
              <span>{money(item.price)} cada</span>

              <div className="qty-control">
                <button
                  type="button"
                  onClick={() => updateQty(item.id, -1)}
                  aria-label="Diminuir quantidade"
                >
                  <Minus />
                </button>

                <b>{item.qty}</b>

                <button
                  type="button"
                  onClick={() => updateQty(item.id, 1)}
                  aria-label="Aumentar quantidade"
                >
                  <Plus />
                </button>
              </div>

              <small className="cart-subtotal">
                Subtotal: <b>{money(Number(item.price) * item.qty)}</b>
              </small>
            </div>

            <button
              type="button"
              className="remove-cart"
              onClick={() => setCart(previous =>
                previous.filter(product => product.id !== item.id)
              )}
              aria-label={`Remover ${item.name}`}
            >
              <Trash2 />
            </button>
          </article>)}
        </div>

        {!cart.length && <div className="empty cart-empty">
          <ShoppingCart />
          <p>Seu carrinho está vazio.</p>
        </div>}

        <div className="cart-footer">
          <div>
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>

          <button
            type="button"
            className="primary-btn full"
            disabled={!cart.length}
            onClick={() => setCheckoutOpen(true)}
          >
            Finalizar pedido <ChevronRight />
          </button>
        </div>
      </aside>
    </div>

    {checkoutOpen && <CheckoutModal
      cart={cart}
      total={total}
      onClose={() => setCheckoutOpen(false)}
      settings={settings}
      onSuccess={finishOrder}
    />}
  </>
}

function CheckoutModal({ cart, total, settings, onClose, onSuccess }) {
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    delivery_type: 'retirada',
    address: '',
    payment_method: 'pix',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState('')

  const discount = Number(coupon?.discount || 0)
  const checkoutTotal = Math.max(0, Number(total) - discount)

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()

    if (!code) {
      setCoupon(null)
      setCouponMessage('Digite um cupom.')
      return
    }

    setCouponLoading(true)
    setCouponMessage('')
    setError('')

    try {
      const { data, error: couponError } = await supabase.rpc(
        'validate_coupon',
        {
          coupon_code_input: code,
          cart_total_input: Number(total)
        }
      )

      if (couponError) throw couponError

      setCoupon(data)
      setCouponCode(code)
      setCouponMessage(`Cupom aplicado: desconto de ${money(data.discount)}.`)
    } catch (couponError) {
      setCoupon(null)
      setCouponMessage(
        couponError.message || 'Cupom inválido ou indisponível.'
      )
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCouponCode('')
    setCouponMessage('')
  }

  const update = (key, value) => setForm(previous => ({
    ...previous,
    [key]: value
  }))

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const items = cart.map(item => ({
        product_id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.qty,
        image: item.image || ''
      }))

      const { data, error: orderError } = await supabase.rpc('create_order', {
        order_payload: { ...form, items, coupon_code: coupon?.code || null }
      })

      if (orderError) throw orderError

      const orderNumber =
        data?.order_number ||
        data?.[0]?.order_number ||
        'novo'

      const finalTotal = Number(
        data?.total ??
        data?.[0]?.total ??
        checkoutTotal
      )
      const finalDiscount = Number(
        data?.discount ??
        data?.[0]?.discount ??
        discount
      )

      const orderTrackingToken =
        data?.tracking_token ||
        data?.[0]?.tracking_token ||
        null
      const orderTrackingUrl = trackingUrl(orderTrackingToken)

      const lines = cart.map(item =>
        `• ${item.name} — ${item.qty}x ${money(item.price)} = ${money(Number(item.price) * item.qty)}`
      )

      const delivery = form.delivery_type === 'entrega'
        ? `Entrega: ${form.address}`
        : 'Retirada combinada'

      const text =
        `Olá, BellaTen! Acabei de fazer o pedido #${orderNumber}.\n\n` +
        `Cliente: ${form.customer_name}\n` +
        `Telefone: ${form.phone}\n` +
        `${delivery}\n` +
        `Pagamento: ${form.payment_method}\n\n` +
        `${lines.join('\n')}\n\n` +
        `${finalDiscount > 0 ? `Cupom: ${coupon?.code}\nDesconto: -${money(finalDiscount)}\n` : ''}` +
        `Total: ${money(finalTotal)}` +
        `${form.notes ? `\nObservações: ${form.notes}` : ''}` +
        `${orderTrackingUrl ? `\n\nAcompanhe seu pedido:\n${orderTrackingUrl}` : ''}`

      const whatsapp = normalizePhone(settings.whatsapp || DEFAULT_SETTINGS.whatsapp)

      window.open(
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`,
        '_blank'
      )

      onSuccess()
    } catch (err) {
      setError(err.message || 'Não foi possível finalizar o pedido.')
    } finally {
      setSaving(false)
    }
  }

  return <div
    className="modal-backdrop checkout-layer"
    onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}
  >
    <form
      className="modal checkout-modal"
      onSubmit={submit}
      onMouseDown={event => event.stopPropagation()}
    >
      <div className="checkout-header">
        <div>
          <small>Última etapa</small>
          <h2>Finalizar pedido</h2>
        </div>

        <button
          type="button"
          className="checkout-close"
          onClick={onClose}
          aria-label="Fechar checkout"
        >
          <X />
        </button>
      </div>

      <div className="form-row">
        <label>
          Nome completo
          <input
            required
            value={form.customer_name}
            onChange={event => update('customer_name', event.target.value)}
          />
        </label>

        <label>
          WhatsApp
          <input
            required
            value={form.phone}
            onChange={event => update('phone', event.target.value)}
            placeholder="(11) 99999-9999"
          />
        </label>
      </div>

      <label>
        E-mail (opcional)
        <input
          type="email"
          value={form.email}
          onChange={event => update('email', event.target.value)}
        />
      </label>

      <div className="choice-grid">
        {settings.pickup_enabled !== false && <button
          type="button"
          className={form.delivery_type === 'retirada' ? 'active' : ''}
          onClick={() => update('delivery_type', 'retirada')}
        >
          <Store /> Retirada
        </button>}

        {settings.delivery_enabled !== false && <button
          type="button"
          className={form.delivery_type === 'entrega' ? 'active' : ''}
          onClick={() => update('delivery_type', 'entrega')}
        >
          <Truck /> Entrega
        </button>}
      </div>

      {form.delivery_type === 'entrega' && <label>
        Endereço completo
        <textarea
          required
          value={form.address}
          onChange={event => update('address', event.target.value)}
          placeholder="Rua, número, bairro e referência"
        />
      </label>}

      <label>
        Forma de pagamento
        <select
          value={form.payment_method}
          onChange={event => update('payment_method', event.target.value)}
        >
          <option value="pix">Pix</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao">Cartão na entrega/retirada</option>
        </select>
      </label>

      <div className="coupon-box">
        <div className="coupon-title">
          <TicketPercent />
          <span>
            <strong>Cupom de desconto</strong>
            <small>Digite o código e clique em aplicar.</small>
          </span>
        </div>

        <div className="coupon-input-row">
          <input
            value={couponCode}
            onChange={event => {
              setCouponCode(event.target.value.toUpperCase())
              if (coupon) setCoupon(null)
              setCouponMessage('')
            }}
            placeholder="EX.: BELLATEN10"
            maxLength={30}
          />

          {coupon
            ? <button
                type="button"
                className="coupon-remove-button"
                onClick={removeCoupon}
              >
                Remover
              </button>
            : <button
                type="button"
                className="coupon-apply-button"
                onClick={applyCoupon}
                disabled={couponLoading}
              >
                {couponLoading ? 'Validando...' : 'Aplicar'}
              </button>}
        </div>

        {couponMessage && <small className={coupon ? 'coupon-success' : 'coupon-error'}>
          {couponMessage}
        </small>}
      </div>

      <label>
        Observações
        <textarea
          value={form.notes}
          onChange={event => update('notes', event.target.value)}
          placeholder="Ex.: preciso de troco, horário preferido..."
        />
      </label>

      <div className="checkout-summary">
        {discount > 0 && <>
          <div>
            <span>Subtotal</span>
            <strong>{money(total)}</strong>
          </div>
          <div className="checkout-discount">
            <span>Desconto ({coupon.code})</span>
            <strong>-{money(discount)}</strong>
          </div>
        </>}

        <div className="checkout-total">
          <span>Total do pedido</span>
          <strong>{money(checkoutTotal)}</strong>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button
        className="primary-btn full"
        disabled={saving}
      >
        {saving
          ? <><LoaderCircle className="spin" /> Finalizando...</>
          : <><MessageCircle /> Confirmar no WhatsApp</>}
      </button>
    </form>
  </div>
}

function Admin({ products, categories, settings, setSettings, reload }) {
  const [session, setSession] = useState(undefined)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => subscription.unsubscribe() }, [])
  if (session === undefined) return <div className="auth-page"><LoaderCircle className="spin" /></div>
  if (!session) return <Login />
  return <AdminPanel products={products} categories={categories} settings={settings} setSettings={setSettings} reload={reload} />
}

function Login() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const submit = async e => { e.preventDefault(); setLoading(true); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError('E-mail ou senha inválidos.'); setLoading(false) }
  return <div className="auth-page"><form className="login-card" onSubmit={submit}><img src={logo} /><span>Painel administrativo</span><h1>Bem-vinda</h1><p>Entre para gerenciar a loja BellaTen.</p><label>E-mail<input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Senha<input required type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p className="form-error">{error}</p>}<button className="primary-btn full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button><Link to="/">Voltar para a loja</Link></form></div>
}

function AdminPanel({ products, categories, settings, setSettings, reload }) {
  const [modal, setModal] = useState(false), [editing, setEditing] = useState(null)
  const [categoryModal, setCategoryModal] = useState(false), [editingCategory, setEditingCategory] = useState(null)
  const [query, setQuery] = useState('')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [productCategoryFilter, setProductCategoryFilter] = useState('Todas')
  const [productSort, setProductSort] = useState('recentes')
  const [productPage, setProductPage] = useState(1)

  const [orderQuery, setOrderQuery] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos')
  const [orderPage, setOrderPage] = useState(1)

  const [customerQuery, setCustomerQuery] = useState('')
  const [customerPage, setCustomerPage] = useState(1)

  const [coupons, setCoupons] = useState([])
  const [couponsLoading, setCouponsLoading] = useState(false)
  const [couponModal, setCouponModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)

  const [stockMovements, setStockMovements] = useState([])
  const [stockLoading, setStockLoading] = useState(false)
  const [stockModal, setStockModal] = useState(false)
  const [stockProduct, setStockProduct] = useState(null)
  const [stockQuery, setStockQuery] = useState('')
  const navigate = useNavigate(), location = useLocation()
  const currentView =
    location.pathname.includes('/configuracoes')
      ? 'configuracoes'
      : location.pathname.includes('/estoque')
        ? 'estoque'
        : location.pathname.includes('/cupons')
          ? 'cupons'
          : location.pathname.includes('/relatorios')
            ? 'relatorios'
            : location.pathname.includes('/categorias')
          ? 'categorias'
          : location.pathname.includes('/produtos')
            ? 'produtos'
            : location.pathname.includes('/pedidos')
              ? 'pedidos'
              : location.pathname.includes('/clientes')
                ? 'clientes'
                : 'dashboard'
  const loadOrders = async () => {
    setOrdersLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    setOrders(data || [])
    setOrdersLoading(false)
  }

  const loadCoupons = async () => {
    setCouponsLoading(true)

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar cupons:', error)
      setCoupons([])
    } else {
      setCoupons(data || [])
    }

    setCouponsLoading(false)
  }

  const loadStockMovements = async () => {
    setStockLoading(true)

    try {
      const { data, error } = await supabase.rpc(
        'get_stock_movements',
        { movement_limit_input: 300 }
      )

      if (error) throw error

      setStockMovements(Array.isArray(data) ? data : [])
    } catch (loadError) {
      console.error('Erro ao carregar movimentações:', loadError)
      setStockMovements([])
    } finally {
      setStockLoading(false)
    }
  }
  useEffect(() => {
    if (['dashboard', 'pedidos', 'clientes', 'relatorios'].includes(currentView)) {
      loadOrders()
    }
  }, [currentView])

  useEffect(() => {
    if (currentView === 'cupons') {
      loadCoupons()
    }
  }, [currentView])

  useEffect(() => {
    if (currentView === 'estoque') {
      loadStockMovements()
    }
  }, [currentView])

  const remove = async id => { if (!confirm('Excluir este produto?')) return; const { error } = await supabase.from('products').delete().eq('id', id); if (error) return alert(error.message); reload() }
  const save = async data => { const payload = { name: data.name, category: data.category, price: Number(data.price), stock: Number(data.stock), image: data.image, description: data.description || '', featured: Boolean(data.featured), active: Boolean(data.active) }; const result = data.id ? await supabase.from('products').update(payload).eq('id', data.id) : await supabase.from('products').insert(payload); if (result.error) throw result.error; setModal(false); setEditing(null); reload() }
  const saveCategory = async data => { const payload = { name: data.name.trim(), image: data.image || '', active: Boolean(data.active), display_order: Number(data.display_order || 0) }; const result = data.id ? await supabase.from('categories').update(payload).eq('id', data.id) : await supabase.from('categories').insert(payload); if (result.error) throw result.error; setCategoryModal(false); setEditingCategory(null); reload() }
  const removeCategory = async item => { const used = products.filter(p => p.category === item.name).length; if (used > 0) return alert(`Esta categoria possui ${used} produto(s).`); if (!confirm(`Excluir ${item.name}?`)) return; const { error } = await supabase.from('categories').delete().eq('id', item.id); if (error) return alert(error.message); reload() }
  const updateOrderStatus = async (id, status) => {
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    await loadOrders()
    setSelectedOrder(previous =>
      previous ? { ...previous, status } : previous
    )
  }
  const saveStockAdjustment = async form => {
    const { error } = await supabase.rpc('adjust_product_stock', {
      product_id_input: Number(form.product_id),
      movement_type_input: form.movement_type,
      quantity_input: Number(form.quantity),
      reason_input: form.reason.trim()
    })

    if (error) throw error

    setStockModal(false)
    setStockProduct(null)
    await Promise.all([reload(), loadStockMovements()])
  }

  const saveCoupon = async form => {
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order: Number(form.min_order || 0),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
      active: Boolean(form.active),
      updated_at: new Date().toISOString()
    }

    const result = form.id
      ? await supabase.from('coupons').update(payload).eq('id', form.id)
      : await supabase.from('coupons').insert(payload)

    if (result.error) throw result.error

    setCouponModal(false)
    setEditingCoupon(null)
    await loadCoupons()
  }

  const removeCouponAdmin = async coupon => {
    if (!confirm(`Excluir o cupom ${coupon.code}?`)) return

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', coupon.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadCoupons()
  }

  const toggleCouponActive = async coupon => {
    const { error } = await supabase
      .from('coupons')
      .update({
        active: !coupon.active,
        updated_at: new Date().toISOString()
      })
      .eq('id', coupon.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadCoupons()
  }

  const logout = async () => { await supabase.auth.signOut(); navigate('/') }
  const pageTitle = {
    dashboard: 'Dashboard',
    produtos: 'Produtos',
    categorias: 'Categorias',
    pedidos: 'Pedidos',
    clientes: 'Clientes',
    relatorios: 'Relatórios',
    estoque: 'Estoque',
    cupons: 'Cupons',
    configuracoes: 'Configurações'
  }[currentView]
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const monthKey = now.toISOString().slice(0, 7)

  const activeOrderStatuses = ['recebido', 'separacao', 'entrega', 'novo', 'atendimento']
  const completedOrders = orders.filter(order => order.status === 'finalizado')
  const todayOrders = orders.filter(order =>
    String(order.created_at || '').slice(0, 10) === todayKey
  )
  const monthOrders = orders.filter(order =>
    String(order.created_at || '').slice(0, 7) === monthKey
  )

  const revenue = completedOrders.reduce(
    (total, order) => total + Number(order.total || 0),
    0
  )
  const revenueToday = todayOrders
    .filter(order => order.status === 'finalizado')
    .reduce((total, order) => total + Number(order.total || 0), 0)
  const revenueMonth = monthOrders
    .filter(order => order.status === 'finalizado')
    .reduce((total, order) => total + Number(order.total || 0), 0)
  const pendingOrders = orders.filter(order =>
    activeOrderStatuses.includes(order.status)
  ).length

  const customers = useMemo(() => { const map = new Map(); orders.forEach(o => { const key = o.phone || o.customer_name; if (!map.has(key)) map.set(key, { name: o.customer_name, phone: o.phone, email: o.email, orders: 0, total: 0, last: o.created_at }); const c = map.get(key); c.orders++; c.total += Number(o.total || 0); if (new Date(o.created_at) > new Date(c.last)) c.last = o.created_at }); return [...map.values()] }, [orders])

  const openSales = orders
    .filter(order => activeOrderStatuses.includes(order.status))
    .reduce((total, order) => total + Number(order.total || 0), 0)

  const adminProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = products.filter(product => {
      const matchesQuery =
        !normalizedQuery ||
        String(product.name || '').toLowerCase().includes(normalizedQuery) ||
        String(product.category || '').toLowerCase().includes(normalizedQuery)

      const matchesCategory =
        productCategoryFilter === 'Todas' ||
        product.category === productCategoryFilter

      return matchesQuery && matchesCategory
    })

    return [...result].sort((a, b) => {
      if (productSort === 'preco-menor') return Number(a.price) - Number(b.price)
      if (productSort === 'preco-maior') return Number(b.price) - Number(a.price)
      if (productSort === 'estoque-menor') return Number(a.stock) - Number(b.stock)
      if (productSort === 'nome') return String(a.name).localeCompare(String(b.name))
      return Number(b.id || 0) - Number(a.id || 0)
    })
  }, [products, query, productCategoryFilter, productSort])

  const filteredOrders = useMemo(() => {
    const normalizedQuery = orderQuery.trim().toLowerCase()

    return orders.filter(order => {
      const normalizedStatus =
        order.status === 'novo'
          ? 'recebido'
          : order.status === 'atendimento'
            ? 'separacao'
            : order.status

      const matchesStatus =
        orderStatusFilter === 'todos' ||
        normalizedStatus === orderStatusFilter

      const matchesQuery =
        !normalizedQuery ||
        String(order.order_number || '').includes(normalizedQuery) ||
        String(order.customer_name || '').toLowerCase().includes(normalizedQuery) ||
        String(order.phone || '').includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [orders, orderQuery, orderStatusFilter])

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = customerQuery.trim().toLowerCase()

    return customers
      .filter(customer =>
        !normalizedQuery ||
        String(customer.name || '').toLowerCase().includes(normalizedQuery) ||
        String(customer.phone || '').includes(normalizedQuery) ||
        String(customer.email || '').toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => Number(b.total) - Number(a.total))
  }, [customers, customerQuery])

  const productPages = Math.max(1, Math.ceil(adminProducts.length / PAGE_SIZE))
  const orderPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const customerPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE))

  const pagedProducts = adminProducts.slice(
    (productPage - 1) * PAGE_SIZE,
    productPage * PAGE_SIZE
  )
  const pagedOrders = filteredOrders.slice(
    (orderPage - 1) * PAGE_SIZE,
    orderPage * PAGE_SIZE
  )
  const pagedCustomers = filteredCustomers.slice(
    (customerPage - 1) * PAGE_SIZE,
    customerPage * PAGE_SIZE
  )

  const salesByDay = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)

      const value = orders
        .filter(order =>
          String(order.created_at || '').slice(0, 10) === key &&
          order.status !== 'cancelado'
        )
        .reduce((total, order) => total + Number(order.total || 0), 0)

      return {
        key,
        label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
          .format(date)
          .replace('.', ''),
        value
      }
    })
  }, [orders])

  const topProducts = useMemo(() => {
    const map = new Map()

    orders
      .filter(order => order.status !== 'cancelado')
      .forEach(order => {
        const items = Array.isArray(order.items) ? order.items : []

        items.forEach(item => {
          const key = item.product_id || item.name
          const current = map.get(key) || {
            name: item.name,
            image: item.image,
            quantity: 0,
            revenue: 0
          }

          current.quantity += Number(item.quantity || 0)
          current.revenue += Number(item.price || 0) * Number(item.quantity || 0)
          map.set(key, current)
        })
      })

    return [...map.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [orders])

  useEffect(() => {
    if (productPage > productPages) setProductPage(productPages)
  }, [productPage, productPages])

  useEffect(() => {
    if (orderPage > orderPages) setOrderPage(orderPages)
  }, [orderPage, orderPages])

  useEffect(() => {
    if (customerPage > customerPages) setCustomerPage(customerPages)
  }, [customerPage, customerPages])

  return <div className="admin-shell">
    <button className="admin-mobile-toggle mobile-only" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu /></button>
    <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}><div className="admin-logo-row"><img src={logo} /><button className="mobile-only" onClick={() => setSidebarOpen(false)}><X /></button></div><nav><NavLink to="/admin" end onClick={() => setSidebarOpen(false)}><LayoutDashboard /> Dashboard</NavLink><NavLink to="/admin/produtos" onClick={() => setSidebarOpen(false)}><Package /> Produtos</NavLink><NavLink to="/admin/categorias" onClick={() => setSidebarOpen(false)}><Tags /> Categorias</NavLink><NavLink to="/admin/pedidos" onClick={() => setSidebarOpen(false)}><ClipboardList /> Pedidos</NavLink><NavLink to="/admin/clientes" onClick={() => setSidebarOpen(false)}><Users /> Clientes</NavLink><NavLink to="/admin/relatorios" onClick={() => setSidebarOpen(false)}><FileSpreadsheet /> Relatórios</NavLink><NavLink to="/admin/estoque" onClick={() => setSidebarOpen(false)}><Boxes /> Estoque</NavLink><NavLink to="/admin/cupons" onClick={() => setSidebarOpen(false)}><TicketPercent /> Cupons</NavLink><NavLink to="/admin/configuracoes" onClick={() => setSidebarOpen(false)}><Settings /> Configurações</NavLink></nav><button onClick={logout}><LogOut /> Sair</button></aside>
    <main className="admin-main"><header><div><span>Painel Administrativo</span><h1>{pageTitle}</h1></div>{currentView === 'produtos' && <button className="primary-btn compact" onClick={() => { setEditing(null); setModal(true) }}><Plus /> Novo produto</button>}{currentView === 'categorias' && <button className="primary-btn compact" onClick={() => { setEditingCategory(null); setCategoryModal(true) }}><Plus /> Nova categoria</button>}{currentView === 'estoque' && <button className="primary-btn compact" onClick={() => { setStockProduct(null); setStockModal(true) }}><Plus /> Ajustar estoque</button>}{currentView === 'cupons' && <button className="primary-btn compact" onClick={() => { setEditingCoupon(null); setCouponModal(true) }}><Plus /> Novo cupom</button>}</header>
      {currentView === 'dashboard' && <>
        <div className="admin-stats dashboard-stats premium">
          <div><span>Faturamento hoje</span><strong>{money(revenueToday)}</strong><TrendingUp /></div>
          <div><span>Faturamento do mês</span><strong>{money(revenueMonth)}</strong><TrendingUp /></div>
          <div><span>Vendas em aberto</span><strong>{money(openSales)}</strong><Clock3 /></div>
          <div><span>Pedidos pendentes</span><strong>{pendingOrders}</strong><ClipboardList /></div>
          <div><span>Clientes</span><strong>{customers.length}</strong><Users /></div>
          <div><span>Estoque baixo</span><strong>{products.filter(p => Number(p.stock) < 10).length}</strong><AlertTriangle /></div>
        </div>

        <section className="premium-dashboard-grid">
          <div className="admin-card sales-chart-card">
            <div className="card-title">
              <div>
                <h2>Vendas dos últimos 7 dias</h2>
                <p>Pedidos recebidos, exceto cancelados.</p>
              </div>
              <strong>{money(salesByDay.reduce((sum, item) => sum + item.value, 0))}</strong>
            </div>
            <SalesChart data={salesByDay} />
          </div>

          <div className="admin-card top-products-card">
            <div className="card-title">
              <div>
                <h2>Produtos mais vendidos</h2>
                <p>Ranking por quantidade.</p>
              </div>
            </div>
            <TopProducts products={topProducts} />
          </div>
        </section>

        <section className="admin-dashboard-grid">
          <div className="admin-card">
            <div className="card-title">
              <div>
                <h2>Pedidos recentes</h2>
                <p>Acompanhe os últimos pedidos recebidos.</p>
              </div>
              <button className="text-btn" onClick={() => navigate('/admin/pedidos')}>
                Ver todos <ChevronRight />
              </button>
            </div>
            <OrdersMini orders={orders.slice(0, 5)} />
          </div>

          <div className="admin-card low-stock-card">
            <div className="card-title">
              <div>
                <h2>Estoque baixo</h2>
                <p>Produtos que precisam de atenção.</p>
              </div>
            </div>
            {products.filter(product => Number(product.stock) < 10).slice(0, 5).map(product =>
              <div className="low-stock-item" key={product.id}>
                <img src={product.image} alt={product.name} />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.stock} unidade(s)</span>
                </div>
              </div>
            )}
            {!products.some(product => Number(product.stock) < 10) &&
              <div className="table-empty">Estoque sob controle.</div>}
          </div>
        </section>
      </>}
      {currentView === 'produtos' && <>
        <div className="admin-stats">
          <div><span>Produtos cadastrados</span><strong>{products.length}</strong></div>
          <div><span>Unidades em estoque</span><strong>{products.reduce((a, p) => a + Number(p.stock), 0)}</strong></div>
          <div><span>Estoque baixo</span><strong>{products.filter(p => Number(p.stock) < 10).length}</strong></div>
        </div>

        <section className="admin-card">
          <div className="admin-toolbar premium-toolbar">
            <div className="search-box">
              <Search />
              <input
                value={query}
                onChange={event => {
                  setQuery(event.target.value)
                  setProductPage(1)
                }}
                placeholder="Buscar por produto ou categoria..."
              />
            </div>

            <select
              value={productCategoryFilter}
              onChange={event => {
                setProductCategoryFilter(event.target.value)
                setProductPage(1)
              }}
            >
              <option>Todas</option>
              {categories.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>

            <select
              value={productSort}
              onChange={event => {
                setProductSort(event.target.value)
                setProductPage(1)
              }}
            >
              <option value="recentes">Mais recentes</option>
              <option value="nome">Nome A–Z</option>
              <option value="preco-menor">Menor preço</option>
              <option value="preco-maior">Maior preço</option>
              <option value="estoque-menor">Menor estoque</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {pagedProducts.map(product => <tr key={product.id}>
                  <td><div className="table-product"><img src={product.image || 'https://placehold.co/80x80?text=Produto'} /><strong>{product.name}</strong></div></td>
                  <td>{product.category}</td>
                  <td>{money(product.price)}</td>
                  <td><span className={Number(product.stock) < 10 ? 'stock-warning' : ''}>{product.stock}</span></td>
                  <td><span className={product.active && product.stock > 0 ? 'status' : 'status off'}>{product.active ? (product.stock > 0 ? 'Ativo' : 'Sem estoque') : 'Oculto'}</span></td>
                  <td><div className="actions"><button onClick={() => { setEditing(product); setModal(true) }}><Pencil /></button><button className="danger" onClick={() => remove(product.id)}><Trash2 /></button></div></td>
                </tr>)}
              </tbody>
            </table>
            {!pagedProducts.length && <div className="table-empty">Nenhum produto encontrado.</div>}
          </div>

          <Pagination page={productPage} pages={productPages} onChange={setProductPage} />
        </section>
      </>}
      {currentView === 'categorias' && <section className="admin-card categories-admin"><div className="categories-admin-header"><div><h2>Categorias da loja</h2><p>Cadastre, edite e organize o catálogo.</p></div><span>{categories.length} categorias</span></div><div className="categories-admin-grid">{categories.map(item => <article key={item.id}><img src={item.image || 'https://placehold.co/120x120?text=Categoria'} /><div className="category-card-content"><strong>{item.name}</strong><span>{products.filter(p => p.category === item.name).length} produto(s)</span><small>{item.active ? 'Visível na loja' : 'Oculta'}</small></div><div className="category-card-actions"><button onClick={() => { setEditingCategory(item); setCategoryModal(true) }}><Pencil /></button><button className="danger" onClick={() => removeCategory(item)}><Trash2 /></button></div></article>)}</div></section>}
      {currentView === 'pedidos' && <section className="admin-card">
        <div className="categories-admin-header">
          <div><h2>Pedidos recebidos</h2><p>Pesquise, filtre e atualize o status.</p></div>
          <span>{filteredOrders.length} pedidos</span>
        </div>

        <div className="admin-toolbar premium-toolbar">
          <div className="search-box">
            <Search />
            <input
              value={orderQuery}
              onChange={event => {
                setOrderQuery(event.target.value)
                setOrderPage(1)
              }}
              placeholder="Buscar por número, cliente ou WhatsApp..."
            />
          </div>

          <select
            value={orderStatusFilter}
            onChange={event => {
              setOrderStatusFilter(event.target.value)
              setOrderPage(1)
            }}
          >
            <option value="todos">Todos os status</option>
            {ORDER_STATUS_OPTIONS.map(([value, label]) =>
              <option key={value} value={value}>{label}</option>
            )}
          </select>
        </div>

        {ordersLoading
          ? <div className="table-empty">Carregando...</div>
          : <>
              <div className="orders-table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Pedido</th><th>Cliente</th><th>Data</th><th>Entrega</th>
                      <th>Pagamento</th><th>Status</th><th>Total</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedOrders.map(order => <tr key={order.id}>
                      <td><strong>#{order.order_number}</strong></td>
                      <td><div className="customer-table-cell"><strong>{order.customer_name}</strong><span>{order.phone}</span></div></td>
                      <td>{dateTime(order.created_at)}</td>
                      <td>{order.delivery_type === 'entrega' ? 'Entrega' : 'Retirada'}</td>
                      <td className="capitalize">{order.payment_method}</td>
                      <td>
                        <select
                          className={`status-select ${order.status}`}
                          value={order.status === 'novo' ? 'recebido' : order.status === 'atendimento' ? 'separacao' : order.status}
                          onChange={event => updateOrderStatus(order.id, event.target.value)}
                        >
                          {ORDER_STATUS_OPTIONS.map(([value, label]) =>
                            <option key={value} value={value}>{label}</option>
                          )}
                        </select>
                      </td>
                      <td><strong className="money-highlight">{money(order.total)}</strong></td>
                      <td><button className="icon-action" onClick={() => setSelectedOrder(order)}><Eye /></button></td>
                    </tr>)}
                  </tbody>
                </table>
                {!pagedOrders.length && <div className="table-empty">Nenhum pedido encontrado.</div>}
              </div>
              <Pagination page={orderPage} pages={orderPages} onChange={setOrderPage} />
            </>}
      </section>}

      {currentView === 'estoque' && <StockPanel
        products={products}
        movements={stockMovements}
        loading={stockLoading}
        query={stockQuery}
        setQuery={setStockQuery}
        onAdjust={product => {
          setStockProduct(product)
          setStockModal(true)
        }}
      />}

      {currentView === 'cupons' && <CouponsPanel
        coupons={coupons}
        loading={couponsLoading}
        onNew={() => {
          setEditingCoupon(null)
          setCouponModal(true)
        }}
        onEdit={coupon => {
          setEditingCoupon(coupon)
          setCouponModal(true)
        }}
        onDelete={removeCouponAdmin}
        onToggle={toggleCouponActive}
      />}

      {currentView === 'relatorios' && <ReportsPanel
        orders={orders}
        products={products}
        loading={ordersLoading}
      />}
      {currentView === 'configuracoes' && <StoreSettings
        settings={settings}
        onSaved={updatedSettings => {
          setSettings(updatedSettings)
          reload()
        }}
      />}
      {currentView === 'clientes' && <section className="admin-card">
        <div className="categories-admin-header">
          <div><h2>Clientes</h2><p>Histórico consolidado automaticamente pelos pedidos.</p></div>
          <span>{filteredCustomers.length} clientes</span>
        </div>

        <div className="admin-toolbar premium-toolbar">
          <div className="search-box">
            <Search />
            <input
              value={customerQuery}
              onChange={event => {
                setCustomerQuery(event.target.value)
                setCustomerPage(1)
              }}
              placeholder="Buscar por nome, WhatsApp ou e-mail..."
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Cliente</th><th>Contato</th><th>Pedidos</th><th>Total comprado</th><th>Último pedido</th><th>Perfil</th></tr>
            </thead>
            <tbody>
              {pagedCustomers.map((customer, index) => <tr key={`${customer.phone}-${index}`}>
                <td><strong>{customer.name}</strong></td>
                <td><div className="contact-cell"><span><Phone /> {customer.phone}</span>{customer.email && <span><Mail /> {customer.email}</span>}</div></td>
                <td>{customer.orders}</td>
                <td><strong className="money-highlight">{money(customer.total)}</strong></td>
                <td>{dateTime(customer.last)}</td>
                <td><span className={customer.orders >= 3 ? 'customer-tier vip' : 'customer-tier'}>{customer.orders >= 3 ? 'Recorrente' : 'Novo'}</span></td>
              </tr>)}
            </tbody>
          </table>
          {!pagedCustomers.length && <div className="table-empty">Nenhum cliente encontrado.</div>}
        </div>

        <Pagination page={customerPage} pages={customerPages} onChange={setCustomerPage} />
      </section>}
    </main>
    {modal && <ProductModal product={editing} categories={categories} onClose={() => { setModal(false); setEditing(null) }} onSave={save} />} {categoryModal && <CategoryModal category={editingCategory} onClose={() => { setCategoryModal(false); setEditingCategory(null) }} onSave={saveCategory} />} {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatus={updateOrderStatus} />} {stockModal && <StockAdjustmentModal products={products} product={stockProduct} onClose={() => { setStockModal(false); setStockProduct(null) }} onSave={saveStockAdjustment} />} {couponModal && <CouponModal coupon={editingCoupon} onClose={() => { setCouponModal(false); setEditingCoupon(null) }} onSave={saveCoupon} />}
  </div>
}

function SalesChart({ data }) {
  const max = Math.max(...data.map(item => item.value), 1)

  return <div className="sales-chart">
    {data.map(item => <div className="sales-bar-column" key={item.key}>
      <div className="sales-bar-value">{item.value > 0 ? money(item.value) : ''}</div>
      <div className="sales-bar-track">
        <div
          className="sales-bar"
          style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 2)}%` }}
        />
      </div>
      <span>{item.label}</span>
    </div>)}
  </div>
}

function TopProducts({ products }) {
  if (!products.length) {
    return <div className="table-empty">Os produtos vendidos aparecerão aqui.</div>
  }

  return <div className="top-products-list">
    {products.map((product, index) => <div key={`${product.name}-${index}`}>
      <span className="ranking-position">{index + 1}</span>
      <img src={product.image || 'https://placehold.co/80x80?text=Produto'} alt={product.name} />
      <div>
        <strong>{product.name}</strong>
        <small>{product.quantity} unidade(s)</small>
      </div>
      <b>{money(product.revenue)}</b>
    </div>)}
  </div>
}

function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null

  return <div className="pagination">
    <button disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
    <span>Página {page} de {pages}</span>
    <button disabled={page >= pages} onClick={() => onChange(page + 1)}>Próxima</button>
  </div>
}





function StockPanel({
  products,
  movements,
  loading,
  query,
  setQuery,
  onAdjust
}) {
  const normalizedQuery = query.trim().toLowerCase()

  const filteredProducts = products
    .filter(product =>
      String(product.name || '').toLowerCase().includes(normalizedQuery) ||
      String(product.category || '').toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => Number(a.stock) - Number(b.stock))

  const totalUnits = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  )
  const lowStock = products.filter(product => Number(product.stock) < 10).length
  const outOfStock = products.filter(product => Number(product.stock) <= 0).length

  return <div className="stock-page">
    <div className="admin-stats stock-stats">
      <div><span>Produtos cadastrados</span><strong>{products.length}</strong><Package /></div>
      <div><span>Unidades em estoque</span><strong>{totalUnits}</strong><Boxes /></div>
      <div><span>Estoque baixo</span><strong>{lowStock}</strong><AlertTriangle /></div>
      <div><span>Sem estoque</span><strong>{outOfStock}</strong><Ban /></div>
    </div>

    <section className="admin-card stock-products-card">
      <div className="stock-toolbar">
        <div>
          <h2>Posição de estoque</h2>
          <p>Acompanhe as quantidades e faça ajustes manuais.</p>
        </div>

        <div className="search-box">
          <Search />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar produto ou categoria..."
          />
        </div>
      </div>

      <div className="stock-product-grid">
        {filteredProducts.map(product => {
          const stock = Number(product.stock || 0)
          const status =
            stock <= 0
              ? { label: 'Sem estoque', className: 'out' }
              : stock < 10
                ? { label: 'Estoque baixo', className: 'low' }
                : { label: 'Disponível', className: 'ok' }

          return <article className="stock-product-card" key={product.id}>
            <img
              src={product.image || 'https://placehold.co/100x100?text=Produto'}
              alt={product.name}
            />

            <div className="stock-product-copy">
              <small>{product.category}</small>
              <strong>{product.name}</strong>
              <span className={`stock-badge ${status.className}`}>
                {status.label}
              </span>
            </div>

            <div className="stock-product-quantity">
              <small>Quantidade</small>
              <strong>{stock}</strong>
            </div>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => onAdjust(product)}
            >
              <Boxes /> Ajustar
            </button>
          </article>
        })}

        {!filteredProducts.length && <div className="table-empty">
          Nenhum produto encontrado.
        </div>}
      </div>
    </section>

    <section className="admin-card stock-history-card">
      <div className="card-title">
        <div>
          <h2>Histórico de movimentações</h2>
          <p>Entradas, saídas e vendas registradas.</p>
        </div>
        <History />
      </div>

      {loading
        ? <div className="table-empty">Carregando movimentações...</div>
        : <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Antes</th>
                  <th>Depois</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(movement => <tr key={movement.id}>
                  <td>{dateTime(movement.created_at)}</td>
                  <td>
                    <div className="stock-history-product">
                      <strong>{movement.product_name}</strong>
                      <small>#{movement.product_id}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`movement-type ${movement.movement_type}`}>
                      {movement.movement_type === 'entrada'
                        ? 'Entrada'
                        : movement.movement_type === 'saida'
                          ? 'Saída'
                          : 'Venda'}
                    </span>
                  </td>
                  <td>
                    <strong className={movement.quantity > 0 ? 'positive' : 'negative'}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </strong>
                  </td>
                  <td>{movement.stock_before}</td>
                  <td>{movement.stock_after}</td>
                  <td>{movement.reason || '—'}</td>
                </tr>)}
              </tbody>
            </table>

            {!movements.length && <div className="table-empty stock-history-empty">
              <History />
              <strong>Nenhuma movimentação registrada.</strong>
              <span>
                O histórico começa a registrar entradas, saídas e vendas
                depois que o módulo de estoque é instalado.
              </span>
            </div>}
          </div>}
    </section>
  </div>
}

function StockAdjustmentModal({ products, product, onClose, onSave }) {
  const [form, setForm] = useState({
    product_id: product?.id || products[0]?.id || '',
    movement_type: 'entrada',
    quantity: 1,
    reason: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedProduct = products.find(
    item => Number(item.id) === Number(form.product_id)
  )

  const update = (key, value) => {
    setForm(previous => ({ ...previous, [key]: value }))
    setError('')
  }

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!form.product_id) {
        throw new Error('Selecione um produto.')
      }

      if (Number(form.quantity) <= 0) {
        throw new Error('A quantidade deve ser maior que zero.')
      }

      await onSave(form)
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível ajustar o estoque.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop">
    <form className="modal stock-adjustment-modal" onSubmit={submit}>
      <div className="drawer-title">
        <div>
          <small>Controle de estoque</small>
          <h2>Ajustar quantidade</h2>
        </div>
        <button type="button" onClick={onClose}><X /></button>
      </div>

      <label>
        Produto
        <select
          value={form.product_id}
          onChange={event => update('product_id', event.target.value)}
        >
          {products.map(item => <option key={item.id} value={item.id}>
            {item.name} — estoque atual: {item.stock}
          </option>)}
        </select>
      </label>

      {selectedProduct && <div className="stock-selected-product">
        <img
          src={selectedProduct.image || 'https://placehold.co/90x90?text=Produto'}
          alt={selectedProduct.name}
        />
        <span>
          <small>Estoque atual</small>
          <strong>{selectedProduct.stock} unidade(s)</strong>
        </span>
      </div>}

      <div className="stock-movement-choice">
        <button
          type="button"
          className={form.movement_type === 'entrada' ? 'active' : ''}
          onClick={() => update('movement_type', 'entrada')}
        >
          <ArrowDownToLine />
          <span>
            <strong>Entrada</strong>
            <small>Adicionar unidades</small>
          </span>
        </button>

        <button
          type="button"
          className={form.movement_type === 'saida' ? 'active' : ''}
          onClick={() => update('movement_type', 'saida')}
        >
          <ArrowUpFromLine />
          <span>
            <strong>Saída</strong>
            <small>Remover unidades</small>
          </span>
        </button>
      </div>

      <label>
        Quantidade
        <input
          required
          type="number"
          min="1"
          step="1"
          value={form.quantity}
          onChange={event => update('quantity', event.target.value)}
        />
      </label>

      <label>
        Motivo
        <textarea
          required
          value={form.reason}
          onChange={event => update('reason', event.target.value)}
          placeholder="Ex.: compra de fornecedor, produto danificado, correção de inventário..."
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-btn full" disabled={saving}>
        {saving
          ? <><LoaderCircle className="spin" /> Salvando...</>
          : 'Confirmar ajuste'}
      </button>
    </form>
  </div>
}

function CouponsPanel({
  coupons,
  loading,
  onNew,
  onEdit,
  onDelete,
  onToggle
}) {
  const now = new Date()

  const couponState = coupon => {
    if (!coupon.active) return { label: 'Inativo', className: 'inactive' }
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return { label: 'Agendado', className: 'scheduled' }
    }
    if (coupon.ends_at && new Date(coupon.ends_at) < now) {
      return { label: 'Expirado', className: 'expired' }
    }
    if (
      coupon.usage_limit !== null &&
      Number(coupon.usage_count) >= Number(coupon.usage_limit)
    ) {
      return { label: 'Esgotado', className: 'expired' }
    }
    return { label: 'Ativo', className: 'active' }
  }

  return <section className="admin-card coupons-page">
    <div className="categories-admin-header">
      <div>
        <h2>Cupons de desconto</h2>
        <p>Crie promoções com porcentagem ou valor fixo.</p>
      </div>
      <span>{coupons.length} cupom(ns)</span>
    </div>

    {loading
      ? <div className="table-empty">Carregando cupons...</div>
      : <div className="coupons-grid">
          {coupons.map(coupon => {
            const state = couponState(coupon)
            const discountLabel = coupon.discount_type === 'percent'
              ? `${Number(coupon.discount_value)}%`
              : money(coupon.discount_value)

            return <article className="coupon-admin-card" key={coupon.id}>
              <div className="coupon-admin-top">
                <span className={`coupon-state ${state.className}`}>
                  {state.label}
                </span>

                <div className="coupon-card-actions">
                  <button
                    type="button"
                    title={coupon.active ? 'Desativar' : 'Ativar'}
                    onClick={() => onToggle(coupon)}
                  >
                    <Power />
                  </button>
                  <button type="button" onClick={() => onEdit(coupon)}>
                    <Pencil />
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onDelete(coupon)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>

              <div className="coupon-code-display">
                <TicketPercent />
                <strong>{coupon.code}</strong>
              </div>

              <h3>{discountLabel} de desconto</h3>
              <p>{coupon.description || 'Cupom promocional da loja.'}</p>

              <div className="coupon-admin-details">
                <span>
                  Pedido mínimo
                  <strong>{money(coupon.min_order || 0)}</strong>
                </span>
                <span>
                  Utilizações
                  <strong>
                    {coupon.usage_count || 0}
                    {coupon.usage_limit !== null
                      ? ` / ${coupon.usage_limit}`
                      : ' / ∞'}
                  </strong>
                </span>
              </div>

              {(coupon.starts_at || coupon.ends_at) && <small className="coupon-period">
                {coupon.starts_at
                  ? `Início: ${dateTime(coupon.starts_at)}`
                  : 'Início imediato'}
                {' · '}
                {coupon.ends_at
                  ? `Fim: ${dateTime(coupon.ends_at)}`
                  : 'Sem expiração'}
              </small>}
            </article>
          })}

          {!coupons.length && <div className="coupons-empty">
            <TicketPercent />
            <h3>Nenhum cupom cadastrado</h3>
            <p>Crie o primeiro cupom promocional da loja.</p>
            <button type="button" className="primary-btn" onClick={onNew}>
              <Plus /> Criar cupom
            </button>
          </div>}
        </div>}
  </section>
}

function CouponModal({ coupon, onClose, onSave }) {
  const localDateTime = value => {
    if (!value) return ''
    const date = new Date(value)
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60000)
      .toISOString()
      .slice(0, 16)
  }

  const [form, setForm] = useState(coupon
    ? {
        ...coupon,
        starts_at: localDateTime(coupon.starts_at),
        ends_at: localDateTime(coupon.ends_at)
      }
    : {
        code: '',
        description: '',
        discount_type: 'percent',
        discount_value: 10,
        min_order: 0,
        starts_at: '',
        ends_at: '',
        usage_limit: '',
        active: true
      }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => {
    setForm(previous => ({ ...previous, [key]: value }))
    setError('')
  }

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (
        form.discount_type === 'percent' &&
        Number(form.discount_value) > 100
      ) {
        throw new Error('O desconto percentual não pode passar de 100%.')
      }

      if (
        form.starts_at &&
        form.ends_at &&
        new Date(form.ends_at) <= new Date(form.starts_at)
      ) {
        throw new Error('A data final precisa ser posterior à data inicial.')
      }

      await onSave(form)
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar o cupom.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop">
    <form className="modal coupon-modal" onSubmit={submit}>
      <div className="drawer-title">
        <div>
          <small>Promoções</small>
          <h2>{coupon ? 'Editar cupom' : 'Novo cupom'}</h2>
        </div>
        <button type="button" onClick={onClose}><X /></button>
      </div>

      <label>
        Código do cupom
        <input
          required
          value={form.code}
          onChange={event => update('code', event.target.value.toUpperCase())}
          placeholder="BELLATEN10"
          maxLength={30}
        />
      </label>

      <label>
        Descrição
        <input
          value={form.description}
          onChange={event => update('description', event.target.value)}
          placeholder="Ex.: desconto de boas-vindas"
        />
      </label>

      <div className="form-row">
        <label>
          Tipo de desconto
          <select
            value={form.discount_type}
            onChange={event => update('discount_type', event.target.value)}
          >
            <option value="percent">Porcentagem</option>
            <option value="fixed">Valor fixo</option>
          </select>
        </label>

        <label>
          {form.discount_type === 'percent'
            ? 'Porcentagem (%)'
            : 'Valor do desconto (R$)'}
          <input
            required
            type="number"
            min="0.01"
            max={form.discount_type === 'percent' ? 100 : undefined}
            step="0.01"
            value={form.discount_value}
            onChange={event => update('discount_value', event.target.value)}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Pedido mínimo
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.min_order}
            onChange={event => update('min_order', event.target.value)}
          />
        </label>

        <label>
          Limite de utilizações
          <input
            type="number"
            min="1"
            value={form.usage_limit}
            onChange={event => update('usage_limit', event.target.value)}
            placeholder="Vazio = ilimitado"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Início
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={event => update('starts_at', event.target.value)}
          />
        </label>

        <label>
          Expiração
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={event => update('ends_at', event.target.value)}
          />
        </label>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.active}
          onChange={event => update('active', event.target.checked)}
        />
        Cupom ativo
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-btn full" disabled={saving}>
        {saving
          ? <><LoaderCircle className="spin" /> Salvando...</>
          : 'Salvar cupom'}
      </button>
    </form>
  </div>
}

function ReportsPanel({ orders, products, loading }) {
  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const defaultEnd = today.toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [statusFilter, setStatusFilter] = useState('todos')

  const filteredOrders = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null

    return orders.filter(order => {
      const createdAt = new Date(order.created_at)
      const withinStart = !start || createdAt >= start
      const withinEnd = !end || createdAt <= end
      const matchesStatus =
        statusFilter === 'todos' || order.status === statusFilter

      return withinStart && withinEnd && matchesStatus
    })
  }, [orders, startDate, endDate, statusFilter])

  const finalized = filteredOrders.filter(order => order.status === 'finalizado')
  const openOrders = filteredOrders.filter(order =>
    ['recebido', 'separacao', 'entrega', 'novo', 'atendimento'].includes(order.status)
  )
  const cancelled = filteredOrders.filter(order => order.status === 'cancelado')

  const finalizedRevenue = finalized.reduce(
    (total, order) => total + Number(order.total || 0),
    0
  )
  const openRevenue = openOrders.reduce(
    (total, order) => total + Number(order.total || 0),
    0
  )

  const averageTicket = finalized.length
    ? finalizedRevenue / finalized.length
    : 0

  const productSales = useMemo(() => {
    const map = new Map()

    filteredOrders
      .filter(order => order.status !== 'cancelado')
      .forEach(order => {
        const items = Array.isArray(order.items) ? order.items : []

        items.forEach(item => {
          const key = String(item.product_id || item.name)
          const current = map.get(key) || {
            name: item.name,
            quantity: 0,
            revenue: 0,
            image: item.image || ''
          }

          const quantity = Number(item.quantity || 0)
          const price = Number(item.price || 0)

          current.quantity += quantity
          current.revenue += quantity * price

          map.set(key, current)
        })
      })

    return [...map.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }, [filteredOrders])

  const dailySales = useMemo(() => {
    const map = new Map()

    filteredOrders.forEach(order => {
      const key = String(order.created_at || '').slice(0, 10)
      if (!key) return

      const current = map.get(key) || {
        date: key,
        orders: 0,
        revenue: 0
      }

      current.orders += 1

      if (order.status === 'finalizado') {
        current.revenue += Number(order.total || 0)
      }

      map.set(key, current)
    })

    return [...map.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
  }, [filteredOrders])

  const maxDailyRevenue = Math.max(
    1,
    ...dailySales.map(item => item.revenue)
  )

  const exportCsv = () => {
    const rows = [
      [
        'Pedido',
        'Data',
        'Cliente',
        'WhatsApp',
        'Status',
        'Entrega',
        'Pagamento',
        'Total'
      ],
      ...filteredOrders.map(order => [
        order.order_number,
        dateTime(order.created_at),
        order.customer_name,
        order.phone,
        ORDER_STATUS[order.status]?.label || order.status,
        order.delivery_type === 'entrega' ? 'Entrega' : 'Retirada',
        order.payment_method,
        Number(order.total || 0).toFixed(2).replace('.', ',')
      ])
    ]

    const csv = rows
      .map(row =>
        row
          .map(value => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(';')
      )
      .join('\n')

    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `relatorio-bellaten-${startDate || 'inicio'}-${endDate || 'fim'}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return <div className="reports-page">
    <section className="admin-card reports-filters">
      <div className="reports-filter-title">
        <div>
          <CalendarDays />
          <span>
            <h2>Período do relatório</h2>
            <p>Filtre os dados antes de analisar ou exportar.</p>
          </span>
        </div>

        <button
          type="button"
          className="primary-btn compact"
          onClick={exportCsv}
          disabled={!filteredOrders.length}
        >
          <Download /> Exportar CSV
        </button>
      </div>

      <div className="reports-filter-grid">
        <label>
          Data inicial
          <input
            type="date"
            value={startDate}
            onChange={event => setStartDate(event.target.value)}
          />
        </label>

        <label>
          Data final
          <input
            type="date"
            value={endDate}
            onChange={event => setEndDate(event.target.value)}
          />
        </label>

        <label>
          Status
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="recebido">Recebidos</option>
            <option value="separacao">Em separação</option>
            <option value="entrega">Saiu para entrega</option>
            <option value="finalizado">Finalizados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </label>
      </div>
    </section>

    <div className="reports-stats">
      <article>
        <span>Pedidos no período</span>
        <strong>{filteredOrders.length}</strong>
        <small>{cancelled.length} cancelado(s)</small>
      </article>

      <article>
        <span>Faturamento realizado</span>
        <strong>{money(finalizedRevenue)}</strong>
        <small>{finalized.length} venda(s) finalizada(s)</small>
      </article>

      <article>
        <span>Vendas em aberto</span>
        <strong>{money(openRevenue)}</strong>
        <small>{openOrders.length} pedido(s) pendente(s)</small>
      </article>

      <article>
        <span>Ticket médio</span>
        <strong>{money(averageTicket)}</strong>
        <small>Média das vendas finalizadas</small>
      </article>
    </div>

    <section className="reports-grid">
      <article className="admin-card report-chart-card">
        <div className="card-title">
          <div>
            <h2>Faturamento por dia</h2>
            <p>Somente pedidos finalizados.</p>
          </div>
        </div>

        {dailySales.length
          ? <div className="reports-bars">
              {dailySales.map(item => {
                const height = Math.max(
                  8,
                  (item.revenue / maxDailyRevenue) * 100
                )

                return <div className="reports-bar-item" key={item.date}>
                  <div className="reports-bar-value">
                    {money(item.revenue)}
                  </div>
                  <div className="reports-bar-track">
                    <span style={{ height: `${height}%` }} />
                  </div>
                  <small>
                    {new Date(`${item.date}T12:00:00`).toLocaleDateString(
                      'pt-BR',
                      { day: '2-digit', month: '2-digit' }
                    )}
                  </small>
                </div>
              })}
            </div>
          : <div className="table-empty">
              Nenhum pedido encontrado no período.
            </div>}
      </article>

      <article className="admin-card report-products-card">
        <div className="card-title">
          <div>
            <h2>Produtos mais vendidos</h2>
            <p>Ranking por quantidade vendida.</p>
          </div>
        </div>

        <div className="report-product-list">
          {productSales.map((product, index) => <div
            className="report-product-item"
            key={`${product.name}-${index}`}
          >
            <b>{index + 1}</b>
            <img
              src={product.image || 'https://placehold.co/72x72?text=Produto'}
              alt={product.name}
            />
            <span>
              <strong>{product.name}</strong>
              <small>{product.quantity} unidade(s)</small>
            </span>
            <em>{money(product.revenue)}</em>
          </div>)}

          {!productSales.length && <div className="table-empty">
            Nenhuma venda encontrada no período.
          </div>}
        </div>
      </article>
    </section>

    <section className="admin-card reports-table-card">
      <div className="card-title">
        <div>
          <h2>Pedidos do período</h2>
          <p>{filteredOrders.length} registro(s) encontrado(s).</p>
        </div>
      </div>

      {loading
        ? <div className="table-empty">Carregando relatório...</div>
        : <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => <tr key={order.id}>
                  <td><strong>#{order.order_number}</strong></td>
                  <td>
                    <div className="report-customer-cell">
                      <strong>{order.customer_name}</strong>
                      <small>{order.phone}</small>
                    </div>
                  </td>
                  <td>{dateTime(order.created_at)}</td>
                  <td>
                    <span className={`order-status ${order.status}`}>
                      {ORDER_STATUS[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td>{order.payment_method || '—'}</td>
                  <td><strong>{money(order.total)}</strong></td>
                </tr>)}
              </tbody>
            </table>
          </div>}
    </section>
  </div>
}

function StoreSettings({ settings, onSaved }) {
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS, ...settings })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({ ...DEFAULT_SETTINGS, ...settings })
  }, [settings])

  const update = (key, value) => {
    setForm(previous => ({ ...previous, [key]: value }))
    setMessage('')
    setError('')
  }

  const uploadImage = async (event, field, folder) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(field)
    setError('')
    setMessage('')

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'webp'
      const path = `settings/${folder}-${Date.now()}-${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(path)

      update(field, data.publicUrl)
    } catch (uploadError) {
      setError(uploadError.message || 'Não foi possível enviar a imagem.')
    } finally {
      setUploading('')
      event.target.value = ''
    }
  }

  const saveSettings = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const payload = {
      id: 1,
      store_name: form.store_name.trim(),
      whatsapp: normalizePhone(form.whatsapp),
      instagram: form.instagram.trim(),
      facebook: form.facebook.trim(),
      address: form.address.trim(),
      pix_key: form.pix_key.trim(),
      business_hours: form.business_hours.trim(),
      footer_text: form.footer_text.trim(),
      seo_title: form.seo_title.trim(),
      seo_description: form.seo_description.trim(),
      logo_url: form.logo_url.trim(),
      banner_desktop_url: form.banner_desktop_url.trim(),
      banner_mobile_url: form.banner_mobile_url.trim(),
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      delivery_enabled: Boolean(form.delivery_enabled),
      pickup_enabled: Boolean(form.pickup_enabled),
      updated_at: new Date().toISOString()
    }

    try {
      const { data, error: saveError } = await supabase
        .from('store_settings')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()

      if (saveError) throw saveError

      const updated = { ...DEFAULT_SETTINGS, ...data }
      setForm(updated)
      onSaved(updated)
      setMessage('Configurações salvas com sucesso.')
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar as configurações.')
    } finally {
      setSaving(false)
    }
  }

  return <form className="settings-page" onSubmit={saveSettings}>
    <section className="admin-card settings-section">
      <div className="settings-section-title">
        <div>
          <Store />
          <span>
            <h2>Identidade da loja</h2>
            <p>Informações exibidas aos clientes.</p>
          </span>
        </div>
      </div>

      <div className="settings-grid two">
        <label>
          Nome da loja
          <input
            required
            value={form.store_name}
            onChange={event => update('store_name', event.target.value)}
          />
        </label>

        <label>
          WhatsApp
          <input
            required
            value={form.whatsapp}
            onChange={event => update('whatsapp', event.target.value)}
            placeholder="5511999999999"
          />
        </label>

        <label>
          Instagram
          <input
            value={form.instagram}
            onChange={event => update('instagram', event.target.value)}
            placeholder="@bellaten.oficial"
          />
        </label>

        <label>
          Facebook
          <input
            value={form.facebook}
            onChange={event => update('facebook', event.target.value)}
            placeholder="https://facebook.com/..."
          />
        </label>

        <label className="settings-full">
          Endereço
          <input
            value={form.address}
            onChange={event => update('address', event.target.value)}
            placeholder="Rua, número, bairro e cidade"
          />
        </label>

        <label>
          Horário de atendimento
          <input
            value={form.business_hours}
            onChange={event => update('business_hours', event.target.value)}
            placeholder="Segunda a sábado, 9h às 18h"
          />
        </label>

        <label>
          Chave Pix
          <input
            value={form.pix_key}
            onChange={event => update('pix_key', event.target.value)}
          />
        </label>

        <label className="settings-full">
          Texto do rodapé
          <textarea
            value={form.footer_text}
            onChange={event => update('footer_text', event.target.value)}
          />
        </label>
      </div>
    </section>

    <section className="admin-card settings-section">
      <div className="settings-section-title">
        <div>
          <ImagePlus />
          <span>
            <h2>Imagens</h2>
            <p>Logo e banners usados na loja.</p>
          </span>
        </div>
      </div>

      <div className="settings-media-grid">
        <SettingsImageField
          title="Logo"
          field="logo_url"
          value={form.logo_url}
          uploading={uploading === 'logo_url'}
          onUpload={event => uploadImage(event, 'logo_url', 'logo')}
          onChange={value => update('logo_url', value)}
        />

        <SettingsImageField
          title="Banner desktop"
          field="banner_desktop_url"
          value={form.banner_desktop_url}
          uploading={uploading === 'banner_desktop_url'}
          onUpload={event => uploadImage(event, 'banner_desktop_url', 'banner-desktop')}
          onChange={value => update('banner_desktop_url', value)}
          wide
        />

        <SettingsImageField
          title="Banner mobile"
          field="banner_mobile_url"
          value={form.banner_mobile_url}
          uploading={uploading === 'banner_mobile_url'}
          onUpload={event => uploadImage(event, 'banner_mobile_url', 'banner-mobile')}
          onChange={value => update('banner_mobile_url', value)}
          wide
        />
      </div>
    </section>

    <section className="admin-card settings-section">
      <div className="settings-section-title">
        <div>
          <Palette />
          <span>
            <h2>Aparência e atendimento</h2>
            <p>Cores e formas de recebimento do pedido.</p>
          </span>
        </div>
      </div>

      <div className="settings-grid two">
        <label className="color-field">
          Cor principal
          <span>
            <input
              type="color"
              value={form.primary_color}
              onChange={event => update('primary_color', event.target.value)}
            />
            <input
              value={form.primary_color}
              onChange={event => update('primary_color', event.target.value)}
            />
          </span>
        </label>

        <label className="color-field">
          Cor secundária
          <span>
            <input
              type="color"
              value={form.secondary_color}
              onChange={event => update('secondary_color', event.target.value)}
            />
            <input
              value={form.secondary_color}
              onChange={event => update('secondary_color', event.target.value)}
            />
          </span>
        </label>

        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={form.delivery_enabled}
            onChange={event => update('delivery_enabled', event.target.checked)}
          />
          <span>
            <strong>Permitir entrega</strong>
            <small>Mostra a opção Entrega no checkout.</small>
          </span>
        </label>

        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={form.pickup_enabled}
            onChange={event => update('pickup_enabled', event.target.checked)}
          />
          <span>
            <strong>Permitir retirada</strong>
            <small>Mostra a opção Retirada no checkout.</small>
          </span>
        </label>
      </div>
    </section>

    <section className="admin-card settings-section">
      <div className="settings-section-title">
        <div>
          <Globe2 />
          <span>
            <h2>Google e compartilhamento</h2>
            <p>Título e descrição básica da loja.</p>
          </span>
        </div>
      </div>

      <div className="settings-grid">
        <label>
          Título do site
          <input
            value={form.seo_title}
            onChange={event => update('seo_title', event.target.value)}
          />
        </label>

        <label>
          Descrição do site
          <textarea
            value={form.seo_description}
            onChange={event => update('seo_description', event.target.value)}
          />
        </label>
      </div>
    </section>

    {(message || error) && <div className={error ? 'settings-feedback error' : 'settings-feedback success'}>
      {error || message}
    </div>}

    <div className="settings-save-bar">
      <span>As alterações aparecem na loja após salvar.</span>
      <button className="primary-btn" disabled={saving || Boolean(uploading)}>
        {saving
          ? <><LoaderCircle className="spin" /> Salvando...</>
          : <><Save /> Salvar configurações</>}
      </button>
    </div>
  </form>
}

function SettingsImageField({
  title,
  field,
  value,
  uploading,
  onUpload,
  onChange,
  wide = false
}) {
  return <div className={`settings-image-field ${wide ? 'wide' : ''}`}>
    <strong>{title}</strong>

    <div className={`settings-image-preview ${wide ? 'banner' : ''}`}>
      {value
        ? <img src={value} alt={title} />
        : <ImagePlus />}
    </div>

    <label className="settings-upload-button">
      <Upload />
      {uploading ? 'Enviando...' : 'Escolher imagem'}
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={onUpload}
      />
    </label>

    <input
      className="settings-url"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder="Ou cole a URL da imagem"
    />
  </div>
}

function OrdersMini({ orders }) {
  return <div className="orders-mini">
    {orders.map(order => <div key={order.id}>
      <div><strong>#{order.order_number}</strong><span>{order.customer_name}</span></div>
      <span className={`order-status ${order.status}`}>{ORDER_STATUS[order.status]?.label || order.status}</span>
      <b>{money(order.total)}</b>
    </div>)}
    {!orders.length && <div className="table-empty">Nenhum pedido ainda.</div>}
  </div>
}

function OrderDetails({ order, onClose, onStatus }) {
  const items = Array.isArray(order.items) ? order.items : []
  const normalizedStatus =
    order.status === 'novo'
      ? 'recebido'
      : order.status === 'atendimento'
        ? 'separacao'
        : order.status

  return <div className="modal-backdrop">
    <div className="modal order-details">
      <div className="drawer-title">
        <div><small>Pedido</small><h2>#{order.order_number}</h2></div>
        <button onClick={onClose}><X /></button>
      </div>

      <div className="order-customer">
        <div><User /><span><small>Cliente</small><strong>{order.customer_name}</strong></span></div>
        <div><Phone /><span><small>WhatsApp</small><strong>{order.phone}</strong></span></div>
        <div><MapPin /><span><small>Entrega</small><strong>{order.delivery_type === 'entrega' ? order.address : 'Retirada'}</strong></span></div>
        <div><Clock3 /><span><small>Data</small><strong>{dateTime(order.created_at)}</strong></span></div>
        <div><CircleDollarSign /><span><small>Pagamento</small><strong className="capitalize">{order.payment_method}</strong></span></div>
        {order.email && <div><Mail /><span><small>E-mail</small><strong>{order.email}</strong></span></div>}
      </div>

      <div className="order-items">
        {items.map((item, index) => <div key={index}>
          <img src={item.image || 'https://placehold.co/80x80?text=Produto'} />
          <span><strong>{item.name}</strong><small>{item.quantity}x {money(item.price)}</small></span>
          <b>{money(item.quantity * item.price)}</b>
        </div>)}
      </div>

      <div className="checkout-total"><span>Total</span><strong>{money(order.total)}</strong></div>

      {order.tracking_token && <div className="order-tracking-actions">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(trackingUrl(order.tracking_token))
            alert('Link de acompanhamento copiado.')
          }}
        >
          <Copy /> Copiar link
        </button>

        <a
          href={trackingUrl(order.tracking_token)}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink /> Abrir acompanhamento
        </a>

        <a
          href={`https://wa.me/${normalizePhone(order.phone)}?text=${encodeURIComponent(
            `Olá, ${order.customer_name}! O status do seu pedido #${order.order_number} é: ${ORDER_STATUS[normalizedStatus]?.label || normalizedStatus}.\n\nAcompanhe aqui:\n${trackingUrl(order.tracking_token)}`
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle /> Enviar atualização
        </a>
      </div>}

      {order.notes && <p className="order-notes"><strong>Observações:</strong> {order.notes}</p>}

      <label>
        Status
        <select value={normalizedStatus} onChange={event => onStatus(order.id, event.target.value)}>
          {ORDER_STATUS_OPTIONS.map(([value, label]) =>
            <option key={value} value={value}>{label}</option>
          )}
        </select>
      </label>
    </div>
  </div>
}

function ProductModal({ product, categories, onClose, onSave }) { const [form, setForm] = useState(product || { name: '', category: categories[0]?.name || '', price: '', stock: 0, image: '', description: '', featured: false, active: true }); const [saving, setSaving] = useState(false), [error, setError] = useState(''); const update = (k, v) => setForm(p => ({ ...p, [k]: v })); const upload = async e => { const file = e.target.files?.[0]; if (!file) return; setSaving(true); const ext = file.name.split('.').pop(); const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`; const { error } = await supabase.storage.from('products').upload(path, file); if (error) { setError(error.message); setSaving(false); return } const { data } = supabase.storage.from('products').getPublicUrl(path); update('image', data.publicUrl); setSaving(false) }; const submit = async e => { e.preventDefault(); setSaving(true); setError(''); try { await onSave(form) } catch (err) { setError(err.message) } finally { setSaving(false) } }; return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="drawer-title"><h2>{product ? 'Editar produto' : 'Novo produto'}</h2><button type="button" onClick={onClose}><X /></button></div><label>Nome<input required value={form.name} onChange={e => update('name', e.target.value)} /></label><label>Categoria<select value={form.category} onChange={e => update('category', e.target.value)}>{categories.filter(c => c.active !== false).map(c => <option key={c.id}>{c.name}</option>)}</select></label><div className="form-row"><label>Preço<input required type="number" min="0" step="0.01" value={form.price} onChange={e => update('price', e.target.value)} /></label><label>Estoque<input required type="number" min="0" value={form.stock} onChange={e => update('stock', e.target.value)} /></label></div><label>Descrição<textarea value={form.description || ''} onChange={e => update('description', e.target.value)} placeholder="Descrição curta do produto" /></label><div className="field-group"><span>Foto do produto</span><div className="file-upload"><input id="product-file" type="file" accept="image/*" onChange={upload} /><label htmlFor="product-file"><Upload /><span>Escolher imagem</span></label><small>{saving ? 'Enviando...' : 'JPG, PNG ou WEBP'}</small></div></div><label>Ou URL da imagem<input value={form.image} onChange={e => update('image', e.target.value)} placeholder="https://..." /></label>{form.image && <img className="preview" src={form.image} />}<label className="checkbox-row"><input type="checkbox" checked={form.featured} onChange={e => update('featured', e.target.checked)} /> Produto em destaque</label><label className="checkbox-row"><input type="checkbox" checked={form.active} onChange={e => update('active', e.target.checked)} /> Produto visível na loja</label>{error && <p className="form-error">{error}</p>}<button className="primary-btn full" disabled={saving}>{saving ? <><LoaderCircle className="spin" /> Salvando...</> : 'Salvar produto'}</button></form></div> }
function CategoryModal({ category, onClose, onSave }) { const [form, setForm] = useState(category || { name: '', image: '', active: true, display_order: 0 }); const [saving, setSaving] = useState(false), [error, setError] = useState(''); const update = (k, v) => setForm(p => ({ ...p, [k]: v })); const upload = async e => { const file = e.target.files?.[0]; if (!file) return; setSaving(true); const ext = file.name.split('.').pop(); const path = `categories/${Date.now()}-${crypto.randomUUID()}.${ext}`; const { error } = await supabase.storage.from('products').upload(path, file); if (error) { setError(error.message); setSaving(false); return } const { data } = supabase.storage.from('products').getPublicUrl(path); update('image', data.publicUrl); setSaving(false) }; const submit = async e => { e.preventDefault(); setSaving(true); setError(''); try { await onSave(form) } catch (err) { setError(err.message) } finally { setSaving(false) } }; return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="drawer-title"><h2>{category ? 'Editar categoria' : 'Nova categoria'}</h2><button type="button" onClick={onClose}><X /></button></div><label>Nome<input required value={form.name} onChange={e => update('name', e.target.value)} /></label><div className="field-group"><span>Imagem da categoria</span><div className="file-upload"><input id="category-file" type="file" accept="image/*" onChange={upload} /><label htmlFor="category-file"><ImagePlus /><span>Escolher imagem</span></label><small>{saving ? 'Enviando...' : 'JPG, PNG ou WEBP'}</small></div></div><label>Ou URL da imagem<input value={form.image} onChange={e => update('image', e.target.value)} /></label>{form.image && <img className="preview category-preview" src={form.image} />}<label>Ordem<input type="number" min="0" value={form.display_order} onChange={e => update('display_order', e.target.value)} /></label><label className="checkbox-row"><input type="checkbox" checked={form.active} onChange={e => update('active', e.target.checked)} /> Categoria visível</label>{error && <p className="form-error">{error}</p>}<button className="primary-btn full" disabled={saving}>{saving ? 'Salvando...' : 'Salvar categoria'}</button></form></div> }

export default App
