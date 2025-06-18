import { motion } from 'framer-motion';
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Link } from 'react-router-dom';
import { toast } from '../../components/ui/toast';
import { useState } from 'react';

export default function Report() {
 
  const [formData, setFormData] = useState({
   
    subject: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send Email via EmailJS
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: import.meta.env.VITE_EMAILJS_SERVICE_ID,
          template_id: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          user_id: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
          template_params: {
            message: `Subject: ${formData.subject}\nMessage: ${formData.description}\n`,
                     },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send report');
              }

      toast.success("Report submitted! Thank you for your feedback. We'll look into this issue shortly.");

      
      setFormData({
         subject: '',
        description: '',
      });
    } catch (error) {
        toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-6">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-orange-400 hover:bg-gray-800 rounded-full"
          >
            <Link to="/profile">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-orange-400">Report a Bug</h1>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 mt-30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl"
        >
          <div className="flex items-start gap-3 mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-300">
              Please provide as much detail as possible about the issue you're experiencing. 
              This will help us resolve it more quickly.
            </p>
          </div>

          <div className="space-y-4">
           

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-gray-300">
                Issue
              </label>
              <Input
                id="subject"
                name="subject"
                type="text"
                placeholder="Briefly describe the issue"
                value={formData.subject}
                onChange={handleChange}
                required
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-300">
                Detailed Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Please describe the issue in detail..."
                rows={5}
                value={formData.description}
                onChange={handleChange}
                required
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}