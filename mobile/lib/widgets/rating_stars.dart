import 'package:flutter/material.dart';

class RatingStars extends StatelessWidget {
  final double rating;
  final double size;
  final Color? color;
  final bool showValue;

  const RatingStars({
    super.key,
    required this.rating,
    this.size = 16,
    this.color,
    this.showValue = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...List.generate(5, (index) {
          return Icon(
            index < rating.floor()
                ? Icons.star
                : index < rating
                    ? Icons.star_half
                    : Icons.star_border,
            size: size,
            color: color ?? Colors.amber,
          );
        }),
        if (showValue) ...[
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: TextStyle(
              fontSize: size * 0.8,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ],
    );
  }
}

class RatingInput extends StatelessWidget {
  final double rating;
  final Function(double) onRatingChanged;
  final double size;

  const RatingInput({
    super.key,
    required this.rating,
    required this.onRatingChanged,
    this.size = 32,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        return IconButton(
          onPressed: () => onRatingChanged((index + 1).toDouble()),
          icon: Icon(
            index < rating ? Icons.star : Icons.star_border,
            size: size,
            color: Colors.amber,
          ),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        );
      }),
    );
  }
}

