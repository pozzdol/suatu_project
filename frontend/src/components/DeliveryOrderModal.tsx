import { useState, useEffect } from "react";
import { Modal, Input, InputNumber, DatePicker } from "antd";
import { toast } from "react-hot-toast";
import { XIcon, PackageIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";

type ProductDeliveryItem = {
  productId: string;
  productName: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  unit?: string;
  deliveryQuantity: number; // Quantity untuk delivery ini
};

type DeliveryOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    items: Array<{ productId: string; quantity: number }>,
    plannedDeliveryDate?: string
  ) => Promise<void>;
  products: ProductDeliveryItem[];
  workOrderNo: string;
};

function DeliveryOrderModal({
  isOpen,
  onClose,
  onSubmit,
  products,
  workOrderNo,
}: DeliveryOrderModalProps) {
  const [items, setItems] = useState<ProductDeliveryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [plannedDeliveryDate, setPlannedDeliveryDate] =
    useState<dayjs.Dayjs | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize items with 0 delivery quantity
      setItems(
        products.map((p) => ({
          ...p,
          deliveryQuantity: 0,
        }))
      );
      setDescription(`Delivery Order for ${workOrderNo}`);
    }
  }, [isOpen, products, workOrderNo]);

  const handleQuantityChange = (productId: string, value: number | null) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId
          ? { ...item, deliveryQuantity: value || 0 }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    // Validate: at least one product must have quantity > 0
    const itemsToDeliver = items.filter((item) => item.deliveryQuantity > 0);

    if (itemsToDeliver.length === 0) {
      toast.error("Please enter delivery quantity for at least one product");
      return;
    }

    // Validate: quantity cannot exceed remaining
    const invalidItems = itemsToDeliver.filter(
      (item) => item.deliveryQuantity > item.remainingQuantity
    );

    if (invalidItems.length > 0) {
      toast.error(
        `Delivery quantity cannot exceed remaining quantity for: ${invalidItems
          .map((i) => i.productName)
          .join(", ")}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = itemsToDeliver.map((item) => ({
        productId: item.productId,
        quantity: item.deliveryQuantity,
      }));

      console.log("Modal submitting items:", JSON.stringify(payload, null, 2));
      console.log(
        "Planned delivery date:",
        plannedDeliveryDate?.format("YYYY-MM-DD")
      );

      await onSubmit(
        payload,
        plannedDeliveryDate
          ? plannedDeliveryDate.format("YYYY-MM-DD")
          : undefined
      );

      // Only close if no error thrown
      toast.success("Delivery order created successfully!");
      onClose();
    } catch (error: any) {
      console.error("Modal: Failed to create delivery order:", error);
      // Don't close modal on error - let user see the error and try again
      toast.error(
        error?.message || "Failed to create delivery order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalDelivery = items.reduce(
    (sum, item) => sum + item.deliveryQuantity,
    0
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 rounded-lg">
            <PackageIcon weight="duotone" className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Create Delivery Order
            </h3>
            <p className="text-sm font-normal text-gray-500">
              Enter quantity to deliver for each product
            </p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={submitting ? "Creating..." : "Create Delivery Order"}
      cancelText="Cancel"
      confirmLoading={submitting}
      width={700}
      closeIcon={<XIcon className="w-5 h-5" />}
      okButtonProps={{
        disabled: submitting || totalDelivery === 0,
        className: "bg-sky-500 hover:bg-sky-600",
      }}
    >
      <div className="space-y-6 mt-6">
        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Input
            placeholder="Enter delivery description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="large"
          />
        </div>

        {/* Planned Delivery Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Planned Delivery Date{" "}
            <span className="font-normal italic text-xs text-gray-500">
              (Optional)
            </span>
          </label>
          <DatePicker
            className="w-full"
            size="large"
            placeholder="Select planned delivery date"
            value={plannedDeliveryDate}
            onChange={(date) => setPlannedDeliveryDate(date)}
            format="DD MMM YYYY"
            // disabledDate={(current) => {
            //   // Disable dates before today
            //   return current && current < dayjs().startOf("day");
            // }}
          />
        </div>

        {/* Products List */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Products to Deliver
          </label>

          <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
            {items.map((item, index) => (
              <div
                key={item.productId}
                className="p-4 rounded-lg border-2 border-gray-100 hover:border-gray-200 bg-white transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {item.productName}
                      </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Ordered</p>
                        <p className="font-medium text-gray-900">
                          {item.orderedQuantity} {item.unit || "PCS"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Delivered</p>
                        <p className="font-medium text-emerald-600">
                          {item.deliveredQuantity} {item.unit || "PCS"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Remaining</p>
                        <p className="font-medium text-amber-600">
                          {item.remainingQuantity} {item.unit || "PCS"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="w-32">
                    <label className="block text-xs text-gray-500 mb-1">
                      Deliver Now
                    </label>
                    <InputNumber
                      min={0}
                      max={item.remainingQuantity}
                      value={item.deliveryQuantity}
                      onChange={(value) =>
                        handleQuantityChange(item.productId, value)
                      }
                      size="large"
                      className="w-full"
                      disabled={item.remainingQuantity === 0}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Warning if exceeds remaining */}
                {item.deliveryQuantity > item.remainingQuantity && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1 rounded">
                    Cannot exceed remaining quantity
                  </div>
                )}

                {/* Info if remaining is 0 */}
                {item.remainingQuantity === 0 && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded">
                    All items have been delivered
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total items to deliver:</span>
            <span className="text-lg font-bold text-sky-600">
              {totalDelivery} items
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default DeliveryOrderModal;
