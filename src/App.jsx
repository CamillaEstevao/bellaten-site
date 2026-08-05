import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, ShoppingCart, User, Menu, X, Truck, ShieldCheck, CircleDollarSign, LockKeyhole,
  Plus, Pencil, Trash2, Package, LayoutDashboard, Tags, LogOut, Minus, MessageCircle,
  Sparkles, Gift, Heart, Upload, LoaderCircle, ImagePlus, ClipboardList, Users, ChevronRight,
  MapPin, Store, CheckCircle2, Clock3, Ban, Eye, Phone, Mail, TrendingUp,
  AlertTriangle, ArrowUpDown
} from 'lucide-react'
import logo from './assets/logo-bellaten-cropped.png'
import { categories as fallbackCategories } from './data'
import { supabase } from './supabase'

const WHATSAPP = '5511940746340'
const INSTAGRAM = 'https://instagram.com/bellaten.oficial'
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

const PAGE_SIZE = 8


function useStore() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('bellaten_cart') || '[]'))
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('bellaten_favorites') || '[]'))

  const loadData = async () => {
    setLoading(true)
    const [productsResult, categoriesResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('display_order', { ascending: true })
    ])
    setProducts(productsResult.data || [])
    setCategories(categoriesResult.data || fallbackCategories.map(([name, image], index) => ({ id: `fallback-${index}`, name, image, active: true, display_order: index + 1 })))
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => localStorage.setItem('bellaten_cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('bellaten_favorites', JSON.stringify(favorites)), [favorites])
  return { products, categories, loading, reload: loadData, cart, setCart, favorites, setFavorites }
}

function App() {
  const store = useStore()
  return <Routes>
    <Route path="/*" element={<Storefront {...store} />} />
    <Route path="/admin/*" element={<Admin {...store} />} />
  </Routes>
}

function Storefront({ products, categories, loading, cart, setCart, favorites, setFavorites, reload }) {
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

  return <div className="site-shell">
    <header className="header">
      <div className="topbar container">
        <button className="icon-btn mobile-only" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button>
        <Link to="/" className="brand"><img src={logo} alt="BellaTen" /></Link>
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
      <section className="hero" id="inicio"><a className="hero-click" href="#produtos" aria-label="Ver produtos"></a></section>
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
    <footer id="contato" className="premium-footer"><div className="container footer-main"><div className="footer-brand"><img src={logo} alt="BellaTen" /><p>Seu novo jeito de comprar beleza.</p></div><div className="footer-links"><strong>Navegação</strong><a href="#inicio">Início</a><a href="#categorias">Categorias</a><a href="#produtos">Produtos</a></div><div className="footer-contact"><strong>Fale com a BellaTen</strong><a href={INSTAGRAM} target="_blank" rel="noreferrer"><span className="social-mark">◎</span> @bellaten.oficial</a><a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></div></div><div className="container footer-bottom"><span>© 2026 BellaTen.</span><span>Desenvolvido por NexCode Studio.</span></div></footer>
    {cartOpen && <CartDrawer cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} updateQty={updateQty} onOrderCreated={reload} />}
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

function CartDrawer({ cart, setCart, onClose, updateQty, onOrderCreated }) {
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
      onSuccess={finishOrder}
    />}
  </>
}

function CheckoutModal({ cart, total, onClose, onSuccess }) {
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
        order_payload: { ...form, items }
      })

      if (orderError) throw orderError

      const orderNumber =
        data?.order_number ||
        data?.[0]?.order_number ||
        'novo'

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
        `Total: ${money(total)}` +
        `${form.notes ? `\nObservações: ${form.notes}` : ''}`

      window.open(
        `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`,
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
        <button
          type="button"
          className={form.delivery_type === 'retirada' ? 'active' : ''}
          onClick={() => update('delivery_type', 'retirada')}
        >
          <Store /> Retirada
        </button>

        <button
          type="button"
          className={form.delivery_type === 'entrega' ? 'active' : ''}
          onClick={() => update('delivery_type', 'entrega')}
        >
          <Truck /> Entrega
        </button>
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

      <label>
        Observações
        <textarea
          value={form.notes}
          onChange={event => update('notes', event.target.value)}
          placeholder="Ex.: preciso de troco, horário preferido..."
        />
      </label>

      <div className="checkout-total">
        <span>Total do pedido</span>
        <strong>{money(total)}</strong>
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

function Admin({ products, categories, reload }) {
  const [session, setSession] = useState(undefined)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => subscription.unsubscribe() }, [])
  if (session === undefined) return <div className="auth-page"><LoaderCircle className="spin" /></div>
  if (!session) return <Login />
  return <AdminPanel products={products} categories={categories} reload={reload} />
}

function Login() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const submit = async e => { e.preventDefault(); setLoading(true); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError('E-mail ou senha inválidos.'); setLoading(false) }
  return <div className="auth-page"><form className="login-card" onSubmit={submit}><img src={logo} /><span>Painel administrativo</span><h1>Bem-vinda</h1><p>Entre para gerenciar a loja BellaTen.</p><label>E-mail<input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Senha<input required type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p className="form-error">{error}</p>}<button className="primary-btn full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button><Link to="/">Voltar para a loja</Link></form></div>
}

function AdminPanel({ products, categories, reload }) {
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
  const navigate = useNavigate(), location = useLocation()
  const currentView = location.pathname.includes('/categorias') ? 'categorias' : location.pathname.includes('/produtos') ? 'produtos' : location.pathname.includes('/pedidos') ? 'pedidos' : location.pathname.includes('/clientes') ? 'clientes' : 'dashboard'
  const loadOrders = async () => { setOrdersLoading(true); const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); setOrders(data || []); setOrdersLoading(false) }
  useEffect(() => { if (['dashboard', 'pedidos', 'clientes'].includes(currentView)) loadOrders() }, [currentView])

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
  const logout = async () => { await supabase.auth.signOut(); navigate('/') }
  const pageTitle = { dashboard: 'Dashboard', produtos: 'Produtos', categorias: 'Categorias', pedidos: 'Pedidos', clientes: 'Clientes' }[currentView]
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
    <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}><div className="admin-logo-row"><img src={logo} /><button className="mobile-only" onClick={() => setSidebarOpen(false)}><X /></button></div><nav><NavLink to="/admin" end onClick={() => setSidebarOpen(false)}><LayoutDashboard /> Dashboard</NavLink><NavLink to="/admin/produtos" onClick={() => setSidebarOpen(false)}><Package /> Produtos</NavLink><NavLink to="/admin/categorias" onClick={() => setSidebarOpen(false)}><Tags /> Categorias</NavLink><NavLink to="/admin/pedidos" onClick={() => setSidebarOpen(false)}><ClipboardList /> Pedidos</NavLink><NavLink to="/admin/clientes" onClick={() => setSidebarOpen(false)}><Users /> Clientes</NavLink></nav><button onClick={logout}><LogOut /> Sair</button></aside>
    <main className="admin-main"><header><div><span>Painel Administrativo</span><h1>{pageTitle}</h1></div>{currentView === 'produtos' && <button className="primary-btn compact" onClick={() => { setEditing(null); setModal(true) }}><Plus /> Novo produto</button>}{currentView === 'categorias' && <button className="primary-btn compact" onClick={() => { setEditingCategory(null); setCategoryModal(true) }}><Plus /> Nova categoria</button>}</header>
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
    {modal && <ProductModal product={editing} categories={categories} onClose={() => { setModal(false); setEditing(null) }} onSave={save} />} {categoryModal && <CategoryModal category={editingCategory} onClose={() => { setCategoryModal(false); setEditingCategory(null) }} onSave={saveCategory} />} {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatus={updateOrderStatus} />}
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
