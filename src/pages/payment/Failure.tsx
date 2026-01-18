import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, MessageCircle, ArrowLeft } from 'lucide-react';

const Failure: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6"
        >
          <XCircle className="w-12 h-12 text-red-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-4">Payment Failed</h1>
          
          <p className="text-muted-foreground text-lg mb-8">
            We couldn't process your payment. Don't worry, no money has been deducted from your account. Please try again or contact support if the issue persists.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <Button
            size="lg"
            onClick={() => navigate('/pricing')}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/contact')}
            className="w-full"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Contact Support
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/')}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-4 bg-muted/50 rounded-lg"
        >
          <p className="text-sm text-muted-foreground">
            <strong>Common reasons for payment failure:</strong>
            <br />
            • Insufficient funds
            <br />
            • Card declined by bank
            <br />
            • Network issues
            <br />
            • Invalid card details
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Failure;
