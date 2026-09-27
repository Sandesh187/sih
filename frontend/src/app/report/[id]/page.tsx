export default function ReportPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-gradient">Report Viewer Placeholder</h2>
        <p className="text-gray-400">Report ID: {params.id}</p>
        <p className="text-sm mt-4 text-gray-500">Additional visualization components (e.g. Sankey) go here.</p>
      </div>
    </div>
  )
}
