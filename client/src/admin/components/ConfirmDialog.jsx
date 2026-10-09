import { AlertTriangle } from 'lucide-react'

const ConfirmDialog = ({ title, message, confirmText = 'Confirm', onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-red-100 p-3 rounded-lg">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-outline">
            Cancel
          </button>
          <button onClick={onConfirm} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
