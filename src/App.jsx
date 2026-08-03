import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, User, Menu, X, Truck, ShieldCheck, CircleDollarSign, LockKeyhole, Plus, Pencil, Trash2, Package, LayoutDashboard, Tags, LogOut, Minus, MessageCircle, Sparkles, Gift, Heart } from 'lucide-react'
import logo from './assets/logo-bellaten-cropped.png'
import { categories, initialProducts } from './data'

const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function useStore() {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('bellaten_products')
    return saved ? JSON.parse(saved) : initialProducts
  })
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('bellaten_cart') || '[]'))
  useEffect(() => localStorage.setItem('bellaten_products', JSON.stringify(products)), [products])
  useEffect(() => localStorage.setItem('bellaten_cart', JSON.stringify(cart)), [cart])
  return { products, setProducts, cart, setCart }
}

function App() {
  const store = useStore()
  return <Routes>
    <Route path="/*" element={<Storefront {...store} />} />
    <Route path="/admin/*" element={<Admin {...store} />} />
  </Routes>
}

function Storefront({ products, cart, setCart }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const filtered = useMemo(() => products.filter(p =>
    (category === 'Todos' || p.category === category) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  ), [products, query, category])
  const qty = cart.reduce((acc, item) => acc + item.qty, 0)

  const addToCart = product => setCart(prev => {
    const found = prev.find(i => i.id === product.id)
    return found ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...product, qty: 1 }]
  })
  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0))

  return <div className="site-shell">
    <header className="header">
      <div className="topbar container">
        <button className="icon-btn mobile-only" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
        <Link to="/" className="brand"><img src={logo} alt="BellaTen" /></Link>
        <div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produtos..." /></div>
        <div className="header-actions">
          <Link className="header-link desktop-only" to="/admin"><User size={19}/> Entrar</Link>
          <button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingCart size={20}/><span className="desktop-only">Carrinho</span>{qty > 0 && <b>{qty}</b>}</button>
        </div>
      </div>
      <nav className={`nav ${menuOpen ? 'open' : ''}`}>
        <div className="container nav-inner">
          <a href="#inicio">Início</a><a href="#produtos">Todos os produtos</a><a href="#categorias">Categorias</a><a href="#sobre">Sobre nós</a><a href="#contato">Contato</a><Link to="/admin" className="mobile-only">Painel administrativo</Link>
        </div>
      </nav>
    </header>

    <main>
      <section className="hero" id="inicio" aria-label="BellaTen — beleza por apenas R$10">
        <a className="hero-click" href="#produtos" aria-label="Ver produtos BellaTen"></a>
      </section>

      <section className="benefits">
        <div className="container benefits-grid">
          <Benefit icon={<CircleDollarSign/>} title="Tudo por R$10" text="Preço único em todos os produtos"/>
          <Benefit icon={<ShieldCheck/>} title="Qualidade garantida" text="Produtos testados e aprovados"/>
          <Benefit icon={<Truck/>} title="Entrega rápida" text="Receba no conforto da sua casa"/>
          <Benefit icon={<LockKeyhole/>} title="Compra segura" text="Seus dados protegidos"/>
        </div>
      </section>

      <section className="section container" id="categorias">
        <div className="section-heading"><span>Explore</span><h2>Categorias</h2><p>Encontre tudo o que você precisa</p></div>
        <div className="categories-grid">
          {categories.map(([name, image]) => <button key={name} className={category === name ? 'category active' : 'category'} onClick={() => { setCategory(name); document.getElementById('produtos')?.scrollIntoView({ behavior:'smooth' }) }}><img src={image}/><strong>{name}</strong></button>)}
          <button className="category" onClick={() => setCategory('Todos')}><span className="category-more">•••</span><strong>Todos</strong></button>
        </div>
      </section>

      <section className="section products-section" id="produtos">
        <div className="container">
          <div className="section-heading"><span>Favoritos</span><h2>{category === 'Todos' ? 'Mais vendidos' : category}</h2><p>Os queridinhos das nossas clientes</p></div>
          <div className="mobile-search mobile-only"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produtos..." /></div>
          <div className="products-grid">{filtered.map(p => <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />)}</div>
          {!filtered.length && <div className="empty">Nenhum produto encontrado.</div>}
        </div>
      </section>

      <section className="brand-section" id="sobre">
        <div className="container brand-panel">
          <div className="brand-copy">
            <span className="eyebrow">O universo BellaTen</span>
            <h2>Beleza que combina com você — sempre por R$10</h2>
            <p>Produtos escolhidos para deixar sua rotina mais bonita, prática e acessível. Novidades, presentes e autocuidado em um só lugar.</p>
            <a className="primary-btn" href="#produtos">Ver todos os produtos</a>
          </div>
          <div className="brand-highlights">
            <div><Sparkles/><strong>Novidades toda semana</strong><span>Achadinhos para renovar sua nécessaire.</span></div>
            <div><Gift/><strong>Perfeito para presentear</strong><span>Monte kits lindos sem gastar muito.</span></div>
            <div><Heart/><strong>Escolhido com carinho</strong><span>Produtos para valorizar todos os estilos.</span></div>
          </div>
        </div>
      </section>
    </main>

    <footer id="contato" className="premium-footer">
      <div className="container footer-main">
        <div className="footer-brand"><img src={logo} alt="BellaTen"/><p>Seu novo jeito de comprar beleza por apenas R$10.</p></div>
        <div className="footer-links"><strong>Navegação</strong><a href="#inicio">Início</a><a href="#categorias">Categorias</a><a href="#produtos">Produtos</a></div>
        <div className="footer-contact"><strong>Fale com a BellaTen</strong><a href="#" aria-label="Instagram"><span className="social-mark">◎</span> Instagram</a><a href="#"><MessageCircle/> WhatsApp</a></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 BellaTen. Todos os direitos reservados.</span><span>Desenvolvido por NexCode Studio.</span></div>
    </footer>
    {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} updateQty={updateQty}/>} 
  </div>
}

const Benefit = ({icon,title,text}) => <div className="benefit">{icon}<div><strong>{title}</strong><span>{text}</span></div></div>

function ProductCard({ product, onAdd }) {
  return <article className="product-card"><div className="product-image"><img src={product.image} alt={product.name}/><span>R$10</span></div><div className="product-info"><small>{product.category}</small><h3>{product.name}</h3><div><strong>{money(product.price)}</strong><button onClick={onAdd} aria-label="Adicionar ao carrinho"><ShoppingCart size={19}/></button></div></div></article>
}

function CartDrawer({ cart, onClose, updateQty }) {
  const total = cart.reduce((a,i) => a + i.price * i.qty, 0)
  return <><div className="drawer-backdrop" onClick={onClose}/><aside className="cart-drawer"><div className="drawer-title"><h2>Seu carrinho</h2><button onClick={onClose}><X/></button></div>{cart.length ? <><div className="cart-list">{cart.map(i => <div className="cart-item" key={i.id}><img src={i.image}/><div><strong>{i.name}</strong><span>{money(i.price)}</span><div className="qty"><button onClick={() => updateQty(i.id,-1)}><Minus size={14}/></button><b>{i.qty}</b><button onClick={() => updateQty(i.id,1)}><Plus size={14}/></button></div></div></div>)}</div><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><button className="primary-btn full">Finalizar pelo WhatsApp</button></> : <div className="empty">Seu carrinho está vazio.</div>}</aside></>
}

function Admin({ products, setProducts }) {
  const [editing, setEditing] = useState(null)
  const [modal, setModal] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
  const remove = id => confirm('Excluir este produto?') && setProducts(prev => prev.filter(p => p.id !== id))
  const save = data => {
    setProducts(prev => data.id ? prev.map(p => p.id === data.id ? data : p) : [...prev, { ...data, id: Date.now() }])
    setModal(false); setEditing(null)
  }
  return <div className="admin-shell">
    <aside className="admin-sidebar"><img src={logo}/><nav><NavLink to="/admin"><LayoutDashboard/> Dashboard</NavLink><NavLink to="/admin/produtos"><Package/> Produtos</NavLink><a href="#"><Tags/> Categorias</a></nav><button onClick={() => navigate('/')}><LogOut/> Ver loja</button></aside>
    <main className="admin-main"><header><div><span>Painel Administrativo</span><h1>Produtos</h1></div><button className="primary-btn compact" onClick={() => {setEditing(null);setModal(true)}}><Plus/> Novo produto</button></header>
      <div className="admin-stats"><div><span>Produtos cadastrados</span><strong>{products.length}</strong></div><div><span>Unidades em estoque</span><strong>{products.reduce((a,p)=>a+Number(p.stock),0)}</strong></div><div><span>Estoque baixo</span><strong>{products.filter(p=>p.stock<20).length}</strong></div></div>
      <section className="admin-card"><div className="admin-toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar produtos..."/></div></div>
        <div className="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><div className="table-product"><img src={p.image}/><strong>{p.name}</strong></div></td><td>{p.category}</td><td>{money(p.price)}</td><td>{p.stock}</td><td><span className={p.stock>0?'status':'status off'}>{p.stock>0?'Ativo':'Sem estoque'}</span></td><td><div className="actions"><button onClick={()=>{setEditing(p);setModal(true)}}><Pencil/></button><button className="danger" onClick={()=>remove(p.id)}><Trash2/></button></div></td></tr>)}</tbody></table></div>
      </section>
    </main>
    {modal && <ProductModal product={editing} onClose={()=>{setModal(false);setEditing(null)}} onSave={save}/>} 
  </div>
}

function ProductModal({ product, onClose, onSave }) {
  const [form,setForm]=useState(product || {name:'',category:'Maquiagem',price:10,stock:0,image:'',featured:false})
  const update=(key,value)=>setForm(prev=>({...prev,[key]:value}))
  return <div className="modal-backdrop"><form className="modal" onSubmit={e=>{e.preventDefault();onSave({...form,price:Number(form.price),stock:Number(form.stock)})}}><div className="drawer-title"><h2>{product?'Editar produto':'Novo produto'}</h2><button type="button" onClick={onClose}><X/></button></div><label>Nome<input required value={form.name} onChange={e=>update('name',e.target.value)}/></label><label>Categoria<select value={form.category} onChange={e=>update('category',e.target.value)}>{categories.map(([c])=><option key={c}>{c}</option>)}</select></label><div className="form-row"><label>Preço<input type="number" min="0" step="0.01" value={form.price} onChange={e=>update('price',e.target.value)}/></label><label>Estoque<input type="number" min="0" value={form.stock} onChange={e=>update('stock',e.target.value)}/></label></div><label>URL da imagem<input required value={form.image} onChange={e=>update('image',e.target.value)} placeholder="https://..."/></label>{form.image&&<img className="preview" src={form.image}/>}<button className="primary-btn full" type="submit">Salvar produto</button></form></div>
}

export default App
