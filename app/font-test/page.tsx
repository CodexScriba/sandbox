export default function FontTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-poppins font-bold mb-8">Poppins Font Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-poppins font-bold mb-4">Font Weights</h2>
          <div className="space-y-4">
            <p className="font-poppins font-thin">Poppins Thin (100)</p>
            <p className="font-poppins font-extralight">Poppins Extra Light (200)</p>
            <p className="font-poppins font-light">Poppins Light (300)</p>
            <p className="font-poppins font-normal">Poppins Regular (400)</p>
            <p className="font-poppins font-medium">Poppins Medium (500)</p>
            <p className="font-poppins font-semibold">Poppins Semi Bold (600)</p>
            <p className="font-poppins font-bold">Poppins Bold (700)</p>
            <p className="font-poppins font-extrabold">Poppins Extra Bold (800)</p>
            <p className="font-poppins font-black">Poppins Black (900)</p>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-poppins font-bold mb-4">Font Comparison</h2>
          <div className="space-y-4">
            <p className="font-sans">Default Sans Font</p>
            <p className="font-mono">Default Mono Font</p>
            <p className="font-poppins">Poppins Font</p>
          </div>
          
          <h3 className="text-xl font-poppins font-semibold mt-8 mb-4">Sample Text</h3>
          <p className="font-poppins">
            This is a sample paragraph using the Poppins font. The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>
    </div>
  );
}
