import { Package } from 'lucide-react'

const EmptyState = ({ 
  icon, 
  title = 'No items found', 
  description = '',
  children
}) => {
  const IconComponent = icon || <Package className="w-16 h-16 text-gray-300" />
  
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {typeof icon === 'object' ? icon : <Package className="w-16 h-16 text-gray-300" />}
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4 max-w-md">{description}</p>}
      {children}
    </div>
  )
}

export default EmptyState
