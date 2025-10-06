import { useState, useEffect } from 'react'
import { ArrowLeft, Package, MapPin, DollarSign, Hash, Calendar, ExternalLink, Building, Tag } from 'lucide-react'
import shopData from './assets/MyShop.json'

// Define the Tool type based on the expected structure from MyShop.json
type Tool = {
  ItemID: string | number
  ProductName: string
  Company?: string
  SKU?: string | number
  Tags?: string
  Price: number
  Qty?: number
  Purchased?: string
  OrderNumber?: string | number
  Barcode?: string
  Location?: string
  SubLocation?: string
  OrderDate?: number
  ProductDetail?: string
  Notes?: string
  HTMLLink?: string
}

interface MyShopToolsProps {
  onNavigateBack: () => void
}

export default function MyShopTools({ onNavigateBack }: MyShopToolsProps) {
  const [tools, setTools] = useState<Tool[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Load the tools data
    const normalizedInventory: Tool[] = shopData.Inventory.map((item: unknown) => {
      const obj = item as Record<string, string | number | undefined>
      return {
        ItemID: obj.ItemID ?? '',
        ProductName: obj.ProductName as string ?? 'Unknown Product',
        Company: obj.Company as string | undefined,
        SKU: obj.SKU,
        Tags: obj.Tags as string | undefined,
        Price: typeof obj.Price === 'string' ? parseFloat(obj.Price) || 0 : (obj.Price as number) || 0,
        Qty: obj.Qty as number | undefined,
        Purchased: obj.Purchased as string | undefined,
        OrderNumber: obj.OrderNumber,
        Barcode: obj.Barcode as string | undefined,
        Location: obj.Location as string | undefined,
        SubLocation: obj.SubLocation as string | undefined,
        OrderDate: obj.OrderDate as number | undefined,
        ProductDetail: obj.ProductDetail as string | undefined,
        Notes: obj.Notes as string | undefined,
        HTMLLink: obj.HTMLLink as string | undefined
      }
    })
    setTools(normalizedInventory)
    if (normalizedInventory.length > 0) {
      setSelectedTool(normalizedInventory[0])
    }
  }, [])

  const filteredTools = tools.filter(tool =>
    tool.ProductName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.Company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(tool.SKU)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.Tags?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateNumber: number) => {
    if (!dateNumber || dateNumber === 0) return 'N/A'
    // Convert Excel date number to JavaScript date
    const date = new Date((dateNumber - 25569) * 86400 * 1000)
    return date.toLocaleDateString()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <div className="shop-tools-container">
      {/* Header */}
      <div className="shop-header">
        <button
          onClick={onNavigateBack}
          className="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </button>
        <div className="header-title">
          <Package className="w-6 h-6" />
          <h1>My Shop Tools</h1>
        </div>
        <div className="tools-count">
          {filteredTools.length} tools
        </div>
      </div>

      <div className="shop-content">
        {/* Left Panel - Tool List */}
        <div className="tools-list-panel">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="tools-list">
            {filteredTools.map((tool) => (
              <div
                key={tool.ItemID}
                className={`tool-item ${selectedTool?.ItemID === tool.ItemID ? 'selected' : ''}`}
                onClick={() => setSelectedTool(tool)}
              >
                <div className="tool-name">{tool.ProductName}</div>
                <div className="tool-meta">
                  <span className="tool-company">{tool.Company}</span>
                  <span className="tool-price">{formatPrice(tool.Price)}</span>
                </div>
                <div className="tool-sku">SKU: {tool.SKU}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Tool Details */}
        <div className="tool-details-panel">
          {selectedTool ? (
            <div className="tool-details">
              <div className="details-header">
                <h2>{selectedTool.ProductName}</h2>
                <div className="item-id">ID: {selectedTool.ItemID}</div>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <div className="section-title">
                    <Building className="w-4 h-4" />
                    Company Information
                  </div>
                  <div className="detail-item">
                    <span className="label">Company:</span>
                    <span className="value">{selectedTool.Company || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Purchased From:</span>
                    <span className="value">{selectedTool.Purchased || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">
                    <DollarSign className="w-4 h-4" />
                    Pricing & Inventory
                  </div>
                  <div className="detail-item">
                    <span className="label">Price:</span>
                    <span className="value price">{formatPrice(selectedTool.Price)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Quantity:</span>
                    <span className="value">{selectedTool.Qty}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">
                    <Hash className="w-4 h-4" />
                    Product Codes
                  </div>
                  <div className="detail-item">
                    <span className="label">SKU:</span>
                    <span className="value">{selectedTool.SKU || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Order Number:</span>
                    <span className="value">{selectedTool.OrderNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Barcode:</span>
                    <span className="value">{selectedTool.Barcode !== 'Null' ? selectedTool.Barcode : 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                  <div className="detail-item">
                    <span className="label">Location:</span>
                    <span className="value">{selectedTool.Location !== 'Null' ? selectedTool.Location : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Sub Location:</span>
                    <span className="value">{selectedTool.SubLocation !== 'Null' ? selectedTool.SubLocation : 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">
                    <Calendar className="w-4 h-4" />
                    Order Information
                  </div>
                  <div className="detail-item">
                    <span className="label">Order Date:</span>
                    <span className="value">{selectedTool.OrderDate ? formatDate(selectedTool.OrderDate) : 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">
                    <Tag className="w-4 h-4" />
                    Additional Info
                  </div>
                  <div className="detail-item">
                    <span className="label">Tags:</span>
                    <span className="value">{selectedTool.Tags !== 'Null' ? selectedTool.Tags : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Product Detail:</span>
                    <span className="value">{selectedTool.ProductDetail !== 'Null' ? selectedTool.ProductDetail : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Notes:</span>
                    <span className="value">{selectedTool.Notes !== 'Null' ? selectedTool.Notes : 'N/A'}</span>
                  </div>
                </div>

                {selectedTool.HTMLLink && selectedTool.HTMLLink !== 'Null' && (
                  <div className="detail-section">
                    <div className="section-title">
                      <ExternalLink className="w-4 h-4" />
                      External Links
                    </div>
                    <div className="detail-item">
                      <a
                        href={selectedTool.HTMLLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Website
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <Package className="w-12 h-12" />
              <p>Select a tool from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}